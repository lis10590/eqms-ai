import psycopg2
from psycopg2 import OperationalError

def test_connection():
    try:
        # Establish the connection
        connection = psycopg2.connect(
            dbname="eqms_db",
            user="postgres",
            password="liskush105",
            host="localhost",
            port="5432"
        )
        
        print("Success! Python is connected to PostgreSQL.")
        
        # Close the connection
        connection.close()
        print("Connection safely closed.")

    except OperationalError as e:
        print(f"Failed to connect to the database. Error:\n{e}")

if __name__ == "__main__":
    test_connection()