from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class DashboardItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str  # This will be the Firebase UID
    title: str
    category: str  # "Bill", "Appointment", "Renewal"
    due_date: datetime
    amount: Optional[float] = None
    is_completed: bool = False
