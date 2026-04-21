import pytest
import init_db
from unittest.mock import patch
import runpy

@patch('init_db.SQLModel.metadata.create_all')
@patch('init_db.engine')
def test_create_db_and_tables(mock_engine, mock_create_all):
    init_db.create_db_and_tables()
    mock_create_all.assert_called_once_with(mock_engine)

def test_init_db_main_execution():
    with patch('builtins.print') as mock_print:
        with patch('init_db.SQLModel.metadata.create_all'):
            runpy.run_module('init_db', run_name='__main__')
            mock_print.assert_any_call("Database initialized successfully!")
