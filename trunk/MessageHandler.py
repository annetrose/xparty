# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created October 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class MessageHandler(XPartyRequestHandler):
    def post(self):
        import json
        self.load_xparty_context(user_type="unknown")
        if self.is_student:
            student = self.person
            teacher = student.lesson.teacher
            task_idx = int(self.request.get("task_idx", 0))
            msg = self.request.get("msg", "")  

            from model import jsonHandler
            activity_type = "message"
            activity_data = { "description":msg, "msg":msg }
            activity_data_json = json.dumps(activity_data, default=jsonHandler)
                        
            from model import StudentActivity
            activity = StudentActivity(
                student = student,
                lesson = student.lesson,
                task_idx = task_idx,
                activity_type = activity_type,
                activity_data_json = activity_data_json
            )
            activity.put()
             
            from updates import send_student_activity
            send_student_activity(student=student, teacher=teacher, task_idx=task_idx, activity_type=activity_type, activity_data=activity_data)      
            response_data = { "status": 1 }
        else:
            response_data = { "status": -1, "msg": "Student not logged in"}
         
        self.response.headers.add_header('Content-Type', 'application/json', charset='utf-8')
        self.response.out.write(json.dumps(response_data))
