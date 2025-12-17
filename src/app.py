"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
import os
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# Pydantic models for request validation
class ActivityCreate(BaseModel):
    name: str
    description: str
    schedule: str
    max_participants: int
    activity_type: str = "regular"  # regular, event, workshop, training

class ActivityUpdate(BaseModel):
    description: Optional[str] = None
    schedule: Optional[str] = None
    max_participants: Optional[int] = None
    activity_type: Optional[str] = None

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"],
        "activity_type": "regular"
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"],
        "activity_type": "regular"
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"],
        "activity_type": "regular"
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"],
        "activity_type": "regular"
    },
    "Basketball Team": {
        "description": "Practice and play basketball with the school team",
        "schedule": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"],
        "activity_type": "regular"
    },
    "Art Club": {
        "description": "Explore your creativity through painting and drawing",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"],
        "activity_type": "regular"
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"],
        "activity_type": "regular"
    },
    "Math Club": {
        "description": "Solve challenging problems and participate in math competitions",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"],
        "activity_type": "regular"
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 12,
        "participants": ["charlotte@mergington.edu", "henry@mergington.edu"],
        "activity_type": "regular"
    },
    "GitHub Skills": {
        "description": "Learn practical coding and collaboration skills with GitHub. Part of the new certifications program!",
        "schedule": "Thursdays, 4:00 PM - 5:00 PM",
        "max_participants": 25,
        "participants": [],
        "activity_type": "regular"
    }
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities(activity_type: Optional[str] = None):
    """Get all activities, optionally filtered by type"""
    if activity_type:
        return {name: details for name, details in activities.items() 
                if details.get("activity_type", "regular") == activity_type}
    return activities


@app.post("/activities")
def create_activity(activity: ActivityCreate):
    """Create a new activity (admin/instructor only)"""
    # Check if activity already exists
    if activity.name in activities:
        raise HTTPException(status_code=400, detail="Activity already exists")
    
    # Validate activity type
    valid_types = ["regular", "event", "workshop", "training"]
    if activity.activity_type not in valid_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid activity type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Create new activity
    activities[activity.name] = {
        "description": activity.description,
        "schedule": activity.schedule,
        "max_participants": activity.max_participants,
        "participants": [],
        "activity_type": activity.activity_type
    }
    
    return {"message": f"Created activity: {activity.name}", "activity": activities[activity.name]}


@app.put("/activities/{activity_name}")
def update_activity(activity_name: str, activity: ActivityUpdate):
    """Update an existing activity (admin/instructor only)"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Validate activity type if provided
    if activity.activity_type is not None:
        valid_types = ["regular", "event", "workshop", "training"]
        if activity.activity_type not in valid_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid activity type. Must be one of: {', '.join(valid_types)}"
            )
    
    # Update activity fields
    activity_data = activities[activity_name]
    if activity.description is not None:
        activity_data["description"] = activity.description
    if activity.schedule is not None:
        activity_data["schedule"] = activity.schedule
    if activity.max_participants is not None:
        activity_data["max_participants"] = activity.max_participants
    if activity.activity_type is not None:
        activity_data["activity_type"] = activity.activity_type
    
    return {"message": f"Updated activity: {activity_name}", "activity": activity_data}


@app.delete("/activities/{activity_name}")
def delete_activity(activity_name: str):
    """Delete an activity (admin/instructor only)"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Remove activity
    deleted_activity = activities.pop(activity_name)
    return {"message": f"Deleted activity: {activity_name}", "activity": deleted_activity}


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is not already signed up
    if email in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up"
        )

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is signed up
    if email not in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is not signed up for this activity"
        )

    # Remove student
    activity["participants"].remove(email)
    return {"message": f"Unregistered {email} from {activity_name}"}
