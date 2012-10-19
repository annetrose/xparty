# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created October 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyHandler import XPartyHandler
from server import exceptions
from server import model_access

# TODO: Make copyright statements consistent
# TODO: Work on format
# Send message to teacher using a HTTP POST request for specified task in current lesson
# URI: /student_message
# Request Data: 
#     task_idx (zero-based task index)
#     msg (string message)
# Example: /student_message (URI), task_idx=0&msg=Hello (request data)
class StudentMessageHandler(XPartyHandler):
    def post(self):
        try:
            self.init_user_context()

            if exceptions.NotAnAuthenticatedStudentError.check(self.user):
                raise exceptions.NotAnAuthenticatedStudentError("You have been logged out.  Please log in again to continue.")
    
            elif exceptions.NotAnActiveActivityError.check(self.user.lesson):
                raise exceptions.NotAnActiveActivityError()
            
            else:
                task_idx = int(self.request.get("task_idx", 0))
                msg = self.request.get("msg", "")
                action_type = "message"
                action_data = { "description": msg, "msg": msg }                        
                model_access.add_student_action(self.user, task_idx, action_type, action_data)
                self.write_response_as_json({ "status": 1 })
        
        except exceptions.XPartyException as e:
            e.write_response_as_json(self)