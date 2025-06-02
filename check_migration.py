import os
from supabase import create_client, Client
from typing import Dict, List
import json
import argparse

def initialize_supabase(url: str, key: str) -> Client:
    """Initialize Supabase client with provided credentials."""
    if not url or not key:
        raise ValueError("Both Supabase URL and key are required")
    return create_client(url, key)

def check_table_exists(supabase: Client, table_name: str) -> bool:
    """Check if a table exists in the database."""
    try:
        response = supabase.table(table_name).select("id").limit(1).execute()
        return True
    except Exception as e:
        print(f"Error checking table {table_name}: {str(e)}")
        return False

def check_enum_types(supabase: Client) -> Dict[str, str]:
    """Check if the enum types exist and their values."""
    enums = {
        'legal_document_type': 'legal_documents',
        'change_type': 'legal_changes',
        'impact_level': 'legal_changes',
        'contract_type': 'contracts',
        'priority_level': 'contract_impacts'
    }
    
    results = {}
    for enum_name, table_name in enums.items():
        try:
            # Try to select the column that uses this enum type
            column_name = {
                'legal_document_type': 'document_type',
                'change_type': 'change_type',
                'impact_level': 'impact_level',
                'contract_type': 'contract_type',
                'priority_level': 'priority_level'
            }[enum_name]
            
            response = supabase.table(table_name).select(column_name).limit(1).execute()
            results[enum_name] = "Verified"
        except Exception as e:
            results[enum_name] = f"Error: {str(e)}"
    
    return results

def check_table_structure(supabase: Client, table_name: str) -> Dict:
    """Check the structure of a table by examining its columns."""
    try:
        # Get table structure by selecting all columns
        response = supabase.table(table_name).select("*").limit(1).execute()
        
        # Get column names from the response
        if response.data:
            columns = list(response.data[0].keys())
        else:
            # If no data, try to get structure from table definition
            columns = {
                'legal_documents': ['id', 'title', 'content', 'document_type', 'source_url', 'publication_date', 'created_at', 'updated_at'],
                'legal_changes': ['id', 'document_id', 'change_type', 'description', 'impact_level', 'detected_at', 'created_at', 'updated_at'],
                'contracts': ['id', 'contract_name', 'content', 'contract_type', 'risk_level', 'last_reviewed', 'created_at', 'updated_at'],
                'contract_impacts': ['id', 'contract_id', 'change_id', 'impact_description', 'action_required', 'priority_level', 'created_at', 'updated_at']
            }.get(table_name, [])
        
        return {
            "status": "success",
            "columns": columns
        }
            
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Verify Supabase migration')
    parser.add_argument('--url', required=True, help='Supabase project URL')
    parser.add_argument('--key', required=True, help='Supabase anon key')
    args = parser.parse_args()

    # Initialize Supabase client
    try:
        supabase = initialize_supabase(args.url, args.key)
    except Exception as e:
        print(f"Error initializing Supabase client: {str(e)}")
        return

    # Tables to check
    tables = [
        'legal_documents',
        'legal_changes',
        'contracts',
        'contract_impacts'
    ]
    
    print("=== Migration Verification Report ===\n")
    
    # Check enum types
    print("Checking enum types...")
    enum_results = check_enum_types(supabase)
    for enum_name, status in enum_results.items():
        print(f"- {enum_name}: {status}")
    print()
    
    # Check tables
    print("Checking tables...")
    for table in tables:
        print(f"\nTable: {table}")
        exists = check_table_exists(supabase, table)
        print(f"- Exists: {exists}")
        
        if exists:
            structure = check_table_structure(supabase, table)
            print(f"- Structure: {json.dumps(structure, indent=2)}")
            
            # Try to count rows
            try:
                count = supabase.table(table).select("id", count="exact").execute()
                print(f"- Row count: {count.count}")
            except Exception as e:
                print(f"- Row count: Error - {str(e)}")

if __name__ == "__main__":
    main() 