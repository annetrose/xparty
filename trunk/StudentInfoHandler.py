# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

# Used by Chrome extension to get info of student currently logged in
class StudentInfoHandler(XPartyRequestHandler):
    def post(self):           
        self.load_xparty_context(user_type="student")
        
        if self.is_student and self.person.is_logged_in:
            from model import get_task_activities
            student = self.person
            task_idx = int(self.request.get("task_idx", 0))
            response_data = { 
                "status": 1, 
                "student_nickname": student.nickname, 
                "anonymous": student.anonymous,
                "lesson": student.lesson.toDict(), 
                "history": get_task_activities(student.lesson, task_idx, student)
            }            
        else:
            response_data = { "status":0, "msg":"Student not logged in" }
         
        import json
        self.response.headers.add_header('Content-Type', 'application/json', charset='utf-8')
        self.response.out.write(json.dumps(response_data))
        