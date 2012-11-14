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

class StudentInfoHandler(XPartyHandler):    
    def post(self):
        try:
            self.init_user_context("student")

            if exceptions.NotAnAuthenticatedStudentError.check(self.user):
                raise exceptions.NotAnAuthenticatedStudentError()
                    
            else:
                task_idx = int(self.request.get("task_idx", 0))
                response_data = { 
                    "status":           1, 
                    "student":          self.user.to_dict(), 
                    "activity":         self.user.activity.to_dict(),
                    "task_history":     model_access.get_student_actions(self.user.activity, task_idx=task_idx, student=self.user)
                }            
                self.write_response_as_json(response_data)
            
        except exceptions.XPartyException as e:
            e.write_response_as_json(self)
            
        