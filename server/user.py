# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created October 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from server import model_access
from server.lib import gaesessions
from google.appengine.api import users

def get_user(user_type=None):
    user = None

    # Check if student                                     
    if user_type in ("student", None):
        user = _check_if_student_logged_in()
    
    # Check if teacher                                     
    if user is None and user_type in ("teacher", None):
        user = _check_if_teacher_logged_in()
        
    return user
     
def get_teacher_login_url():
    return users.create_login_url("/teacher_login")
    
def get_teacher_logout_url(url):
    return users.create_logout_url("/")
   
def _check_if_student_logged_in():
    session = gaesessions.get_current_session()
    student = model_access.get_student(session_sid=session.sid)
            
    # Check if student logged into this browser at some point but logged out passively
    # If so, passively log student in again
    if student is not None and not student.is_logged_in:
        student = model_access.update_student_login_time(student)
          
    return student

def _check_if_teacher_logged_in():
    # Teachers are authenticated by their Google account.
    google_user = users.get_current_user()
    teacher = model_access.get_teacher(google_user.user_id()) if google_user is not None else None
    return teacher