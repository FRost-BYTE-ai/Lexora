import os
import zipfile
import pandas as pd
import json

base_dir = r"C:\Lexora\data\raw\indian-law-kaggle"
zip_path = os.path.join(base_dir, "indian-law.zip")

print(f"Extracting {zip_path}...")
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(base_dir)

print("\n--- EXTRACTED FILES ---")
extracted_files = [f for f in os.listdir(base_dir) if f != "indian-law.zip"]

for f in extracted_files:
    file_path = os.path.join(base_dir, f)
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    print(f"File: {f}")
    print(f"Size: {size_mb:.2f} MB")
    
    if f.endswith('.csv'):
        print("Format: CSV")
        df = pd.read_csv(file_path)
        print(f"Number of rows/records: {len(df)}")
        print(f"Columns/Schema: {list(df.columns)}")
        print("\nSample (2 rows):")
        # Print sample properly formatted
        sample = df.head(2).to_dict(orient='records')
        print(json.dumps(sample, indent=2, default=str))
    elif f.endswith('.json'):
        print("Format: JSON")
        try:
            df = pd.read_json(file_path)
            print(f"Number of rows/records: {len(df)}")
            print(f"Columns/Schema: {list(df.columns)}")
            print("\nSample (2 rows):")
            sample = df.head(2).to_dict(orient='records')
            print(json.dumps(sample, indent=2, default=str))
        except Exception as e:
            print(f"Could not parse as standard pandas JSON: {e}")
            with open(file_path, 'r', encoding='utf-8') as f_json:
                data = json.load(f_json)
                if isinstance(data, list):
                    print(f"Format: JSON Array, Length: {len(data)}")
                    print("\nSample (2 items):")
                    print(json.dumps(data[:2], indent=2, default=str))
                else:
                    print(f"Format: JSON Object")
                    print(f"Keys: {list(data.keys())}")
    elif f.endswith('.jsonl'):
        print("Format: JSONL")
        df = pd.read_json(file_path, lines=True)
        print(f"Number of rows/records: {len(df)}")
        print(f"Columns/Schema: {list(df.columns)}")
        print("\nSample (2 rows):")
        sample = df.head(2).to_dict(orient='records')
        print(json.dumps(sample, indent=2, default=str))
    
    print("-" * 40)
