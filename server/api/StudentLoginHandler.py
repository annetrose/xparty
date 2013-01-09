# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyHandler import XPartyHandler
from server import exceptions
from server import model_access
from server.lib import gaesessions
import random, string
        
class StudentLoginHandler(XPartyHandler):    
    def post(self):
        try:   
            self.init_user_context("student")
            student_nickname = self.request.get("student_nickname")
            student_nickname = " ".join(student_nickname.split())
            anonymous = True if not student_nickname else False
            activity_code = self.request.get("activity_code")
            ext = int(self.request.get("ext", 0))
                 
            # Retrieve activity from datastore
            # - If activity does not exist, this will return None.
            # - If activity existed but is disabled, it will return the activity, but activity.is_active will be False.
            # - If activity existed but was deleted (hidden), it will return the activity, but activity.is_deleted will be True.
            #   (Deleting activities is done lazily.  Actually, they are merely hidden from the teacher's view.)
            activity = model_access.get_activity(activity_code) if activity_code != "" else None
             
            if not activity_code:
                raise exceptions.XPartyException("Please enter an activity code.")
            
            # Activity not found
            if exceptions.ActivityNotFoundError.check(activity):
                raise exceptions.ActivityNotFoundError("Please check the activity code.")

            # Activity is no longer active or was deleted (hidden)
            elif exceptions.NotAnActiveActivityError.check(activity):
                raise exceptions.NotAnActiveActivityError("This activity is finished.")
                        
            else:                
                # Fetch student from datastore
                # Might return None if nobody has ever logged in with this nickname+activity combination        
                if student_nickname:
                    student = model_access.get_student(student_nickname, activity_code)
                    
                # If no student nickname, generate an anonymous one
                else:
                    student = None
                    alphabet = string.letters + string.digits
                    for i in range(10):
                        anonymous_nickname = "".join(random.choice(alphabet) for j in range(10))                    
                        anonymous_student = model_access.get_student(anonymous_nickname, activity_code)
                        if anonymous_student is None:
                            student_nickname = anonymous_nickname
                            break
                
                if student_nickname is None:
                    raise exceptions.XPartyException("An anonymous login could not be created.")
                            
                else:
                    session = gaesessions.get_current_session()
                    
                    # Student found
                    if student is not None:
                        
                        # Check if student already logged in to another session
                        if student.is_logged_in and session.sid != student.session_sid:
                            raise exceptions.XPartyException("Please choose another name. Someone is already logged in as %s."%\
                                (student_nickname.encode("ascii","xmlcharrefreplace")), "Session ID doesn't match.", 
                                student.session_sid, session.sid, student.latest_login_timestamp, student.latest_logout_timestamp)
                        
                        # Otherwise, update login info
                        else:
                            model_access.update_student_login_time(student, session_sid=session.sid)
        
                    # Create new student
                    else: 
                        student = model_access.create_student({
                            'student_nickname': student_nickname,
                            'anonymous':        anonymous,
                            'activity':         activity,
                            'session_sid':      session.sid
                        })
        
                    self.user = student
                
                    response_data = { "status": 1, "nickname": model_access.get_person_nickname(self.user), "ext": ext }            
                    self.write_response_as_json(response_data)

        except exceptions.XPartyException as e:
            self.user = None
            e.write_response_as_json(self)
