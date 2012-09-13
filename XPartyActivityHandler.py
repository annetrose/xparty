# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created September 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class XPartyActivityHandler(XPartyRequestHandler):
    def post(self):           
        self.load_xparty_context(user_type="student")

        if self.is_student and self.person.is_logged_in:
            from model import StudentActivity
            activity = StudentActivity(
                student = self.person,
                lesson = self.person.lesson,
                task_idx = int(self.request.get("task_idx", 0)),
                activity_type = 'default',
            )
            activity.put()
            
            response_data = { "status":1 }
            
        else:
            response_data = { "status":0, "msg":"Student not logged in" }
         
        import json
        self.response.headers.add_header('Content-Type', 'application/json', charset='utf-8')
        self.response.out.write(json.dumps(response_data))