import os
import json
import hashlib
import psycopg2
from sentence_transformers import SentenceTransformer
from sklearn.cluster import DBSCAN
import numpy as np
from datetime import datetime, timedelta
from dotenv import load_dotenv
from web3 import Web3

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# DB Connection
def get_db_connection():
    return psycopg2.connect(os.getenv('DATABASE_URL'))

# Blockchain setup
POLYGON_RPC = os.getenv('POLYGON_RPC_URL', 'https://rpc-amoy.polygon.technology')
PRIVATE_KEY = os.getenv('PRIVATE_KEY')
CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS')

# Simple ABI for PatentProof storeHash(bytes32 hash)
CONTRACT_ABI = json.loads('[{"inputs":[{"internalType":"bytes32","name":"hash","type":"bytes32"}],"name":"storeHash","outputs":[],"stateMutability":"nonpayable","type":"function"}]')

def store_on_blockchain(pattern_summary):
    if not PRIVATE_KEY or not CONTRACT_ADDRESS:
        print("Blockchain credentials missing. Skipping blockchain storage.")
        return None, None

    try:
        w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))
        account = w3.eth.account.from_key(PRIVATE_KEY)
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

        # Generate Hash
        hash_val = hashlib.sha256(pattern_summary.encode()).hexdigest()
        hash_bytes = bytes.fromhex(hash_val)

        # Build transaction
        nonce = w3.eth.get_transaction_count(account.address)
        tx = contract.functions.storeHash(hash_bytes).build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gas': 200000,
            'gasPrice': w3.eth.gas_price
        })

        # Sign and send
        signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        return hash_val, w3.to_hex(tx_hash)
    except Exception as e:
        print(f"Blockchain Error: {e}")
        return hashlib.sha256(pattern_summary.encode()).hexdigest(), "SIMULATED_TX_ID"

def run_analysis():
    conn = get_db_connection()
    cur = conn.cursor()

    # 1. Fetch recent complaints (last 30 days)
    cur.execute("SELECT id, description, location, created_at, category FROM complaints WHERE created_at > NOW() - INTERVAL '30 days'")
    complaints = cur.fetchall()

    if len(complaints) < 5:
        print("Not enough complaints for analysis.")
        return

    # 2. NLP Embeddings
    model = SentenceTransformer("all-MiniLM-L6-v2")
    texts = [c[1] for c in complaints]
    embeddings = model.encode(texts)

    # 3. Clustering (DBSCAN)
    # Combining text embedding with some numerical representation of location/time if needed
    # For now, let's cluster primarily on text similarity
    dbscan = DBSCAN(eps=0.5, min_samples=3) # Adjusted min_samples for demo
    clusters = dbscan.fit_predict(embeddings)

    # 4. Pattern Detection Logic
    detected_patterns = []
    unique_clusters = set(clusters)
    
    for cluster_id in unique_clusters:
        if cluster_id == -1: continue # Noise
        
        cluster_indices = [i for i, x in enumerate(clusters) if x == cluster_id]
        cluster_complaints = [complaints[i] for i in cluster_indices]
        
        count = len(cluster_complaints)
        area = cluster_complaints[0][2] # Simplified: take first location
        
        # PATTERN RECOGNITION LOGIC
        
        # 1. Determine Issue Category based on majority in cluster
        categories = [c[4] for c in cluster_complaints] 
        dominant_category = max(set(categories), key=categories.count) if categories else "Unknown"

        # Broaden issue type detection beyond just water, but keep the water specificity if present
        issue_type = "Systemic Infrastructure Issue"
        if "supply" in dominant_category or "supply" in cluster_complaints[0][1].lower(): 
             issue_type = "Severe Water Supply Disruption"
        elif "quality" in dominant_category: 
             issue_type = "Potable Water Contamination"
        elif "infra" in dominant_category: 
             issue_type = "Critical Infrastructure Failure"
        
        # 2. Calculate Severity Score (Universal Logic)
        supply_ratio = count / 100 
        cluster_density_score = min(count * 5, 50) 
        
        severity_index = (supply_ratio * 40) + cluster_density_score + 10 # Base score
        
        # Health Risk Multiplier (Critical for UIIS)
        health_keywords = ['diarrhea', 'typhoid', 'sick', 'hospital', 'child', 'poison', 'dengue', 'monsoon']
        is_health_risk = any(any(kw in c[1].lower() for kw in health_keywords) for c in cluster_complaints)
        
        if is_health_risk:
            severity_index *= 1.5
            issue_type += " (Public Health Risk)"

        severity_level = "CRITICAL" if severity_index > 70 else "HIGH" if severity_index > 40 else "MODERATE"
        
        summary = f"{issue_type}|{area}|{count}|Score:{int(severity_index)}"
        
        # Blockchain storage
        blockchain_hash, tx_id = store_on_blockchain(summary)
        
        detected_patterns.append({
            'issue': issue_type,
            'area': area,
            'count': count,
            'severity': severity_level,
            'blockchain_hash': blockchain_hash,
            'tx_id': tx_id
        })

    # 5. Save to DB
    for p in detected_patterns:
        # Check if similar pattern already exists to avoid duplicates
        cur.execute("SELECT id FROM patterns WHERE issue = %s AND area = %s AND created_at > NOW() - INTERVAL '24 hours'", (p['issue'], p['area']))
        if cur.fetchone():
            continue
            
        cur.execute(
            "INSERT INTO patterns (issue, area, count, severity, blockchain_hash, tx_id) VALUES (%s, %s, %s, %s, %s, %s)",
            (p['issue'], p['area'], p['count'], p['severity'], p['blockchain_hash'], p['tx_id'])
        )

    conn.commit()
    cur.close()
    conn.close()
    print(f"Analysis complete. {len(detected_patterns)} patterns processed.")

if __name__ == "__main__":
    run_analysis()
