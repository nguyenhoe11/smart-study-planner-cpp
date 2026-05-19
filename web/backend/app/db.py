import os
from contextlib import contextmanager

import pyodbc
from dotenv import load_dotenv


load_dotenv()


def build_connection_string() -> str:
    driver = os.getenv("DB_DRIVER", "ODBC Driver 18 for SQL Server")
    server = os.getenv("DB_SERVER", r"HOANE\SQLEXPRESS")
    database = os.getenv("DB_NAME", "SmartStudyPlanner")
    trusted = os.getenv("DB_TRUSTED_CONNECTION", "yes")

    return (
        f"Driver={{{driver}}};"
        f"Server={server};"
        f"Database={database};"
        f"Trusted_Connection={trusted};"
        "Encrypt=no;"
        "TrustServerCertificate=yes;"
    )


@contextmanager
def get_connection():
    connection = pyodbc.connect(build_connection_string())
    try:
        yield connection
    finally:
        connection.close()


def fetch_all(sql: str, params=()):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, params)
        columns = [column[0] for column in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def fetch_one(sql: str, params=()):
    rows = fetch_all(sql, params)
    return rows[0] if rows else None


def execute(sql: str, params=()):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, params)
        connection.commit()

