# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class TeacherDashboard(XPartyRequestHandler):

    def get(self):
        self.load_xparty_context(user_type="teacher")

        try:
            if not self.is_teacher:
                raise NotAnAuthenticatedTeacherError()
            
            else:
                lesson = None
                form_item = lambda key:self.request.get(key, "").strip()
                if form_item is not None:
                    lesson_code = form_item("lesson_code")
                    if lesson_code != "":
                        from model import Lesson
                        lesson = Lesson.get_by_key_name(lesson_code)       
                    action = form_item("action")
                if action=="create":
                    self.create_edit_lesson(form_item)
                elif action=="clone":
                    self.clone_lesson(lesson)
                elif action=="edit":
                    self.create_edit_lesson(form_item)
                elif action=="start":
                    self.start_lesson(lesson)  
                elif action=="stop":
                    self.stop_lesson(lesson)
                elif action=="stopall":
                    self.stop_all_lessons()
                elif action=="clear":
                    self.clear_lesson(lesson)
                elif action=="delete":
                    self.delete_lesson(lesson)
                elif action=="deleteall":
                    self.delete_all_lessons()
                elif action=="logoutstudent":
                    from model import Student
                    student_nickname = form_item("student_nickname")
                    student_key = "::".join((student_nickname, lesson_code))
                    student = Student.get_by_key_name(student_key)
                    self.log_out_student(student)
                elif action=="logoutallstudents":
                    self.log_out_all_students(lesson)
                else:
                    self.show_dashboard()

        except NotAnAuthenticatedTeacherError:
            self.redirect_to_teacher_login()

    def post(self):
        self.get();
        
    def show_dashboard(self):
        import helpers
        import settings
            
        template_values = {
            "teacher_name"  :self.person.nickname,
            "header"        : self.gen_header("teacher"),
            "lessons"       : self.get_lessons(),
            "dbg_timestamp" : (helpers.timestamp() if settings.ENABLE_FILLER_FORM_FILLING else "")
        }

        if self.session.has_key('msg'):
            template_values['msg'] = self.session.pop('msg')
                    
        self.write_response_with_template("teacher_dashboard.html", template_values)
            
    def create_edit_lesson(self, form_item):
        lesson_code = form_item("lesson_code")
        is_new = lesson_code == ""
        if is_new:
            lesson_code = self.make_lesson_code()
        lesson_title = form_item("lesson_title")
        lesson_description = form_item("lesson_description")
        class_name = form_item("class_name")
        task_infos = []
    
        for task_num in range(1, int(self.request.get("max_num_tasks", "1"))+1):
            task_title = form_item("task_title_%d"%task_num)
            task_description = form_item("task_description_%d"%task_num)
            task_layout = form_item("task_layout_%d"%task_num)
            if task_title != "":
                task_infos.append((task_title, task_description, task_layout))

        import json
        tasks_json = json.dumps(task_infos)

        if (len(lesson_title) > 0) and (len(lesson_code) > 0) and (len(task_infos) > 0):
            from model import Lesson
            from datetime import datetime
            now = datetime.now()

            lesson = Lesson(key_name=lesson_code,
                teacher=self.person, title=lesson_title, lesson_code=lesson_code,
                description=lesson_description, class_name=class_name, 
                tasks_json=tasks_json, start_time=now, stop_time=None)
            
            if not is_new:
                old_lesson = Lesson.get_by_key_name(lesson_code)       
                lesson.start_time = old_lesson.start_time
                lesson.stop_time = old_lesson.stop_time
            
            lesson.put()
            
            lesson_infos = []
            for lesson in self.get_lessons():
                if not lesson.is_deleted:
                    lesson_infos.append(lesson.toDict())
            lessons_json = json.dumps(lesson_infos, default=lesson.jsonHandler)
            self.response.out.write(lessons_json)
        
        else:
            data = { 'error': 1, 'msg': 'Required fields are missing.' }
            self.response.out.write(json.dumps(data))
            
    def clone_lesson(self, lesson):
        lesson_title = lesson.title + " (Clone)"
        lesson_code = self.make_lesson_code()
        
        task_infos = []
        for task_idx in range(0, len(lesson.tasks)):
            task_title = lesson.tasks[task_idx][0];
            if task_title != "":
                task_description = lesson.tasks[task_idx][1];
                task_layout = lesson.tasks[task_idx][2] if len(lesson.tasks[task_idx])>=3 else "";
                task_infos.append((task_title, task_description, task_layout))

        import json
        tasks_json = json.dumps(task_infos)

        from datetime import datetime
        from model import Lesson
        lesson = Lesson(key_name=lesson_code,
            teacher=self.person, title=lesson_title, lesson_code=lesson_code,
            description=lesson.description, class_name=lesson.class_name, 
            start_time=datetime.now(), stop_time=lesson.stop_time, tasks_json=tasks_json)
        lesson.put()           
        self.response.out.write(lesson.getJson())
        
    def start_lesson(self, lesson, write_response=True):
        lesson.stop_time = None
        lesson.put()
        if write_response:
            self.write_response_plain_text("OK")

    def stop_lesson(self, lesson, write_response=True):
        from datetime import datetime
        now = datetime.now()
        lesson.stop_time = now
        lesson.put()
        
        if write_response:
            self.write_response_plain_text("OK")

    def stop_all_lessons(self):
        from model import Lesson
        lessons = Lesson.fetch_all(filter_expr="teacher", filter_value=self.person)
        for lesson in lessons:
            self.stop_lesson(lesson, False)
                
        self.write_response_plain_text("OK")
       
    def clear_lesson(self, lesson, write_response=True):
        from model import Student, StudentActivity
        from google.appengine.ext import db
        db.delete(StudentActivity.fetch_all("lesson =", lesson))
        db.delete(Student.fetch_all("lesson =", lesson))
        self.log_out_all_students(lesson, False);
        if write_response:
            self.write_response_plain_text("OK")
                
    def delete_lesson(self, lesson, write_response=True):
        from datetime import datetime
        now = datetime.now()
        lesson.deleted_time = now
        if lesson.stop_time is None:
            lesson.stop_time = now
        lesson.put()
        self.log_out_all_students(lesson, False);
        if write_response:
            self.write_response_plain_text("OK")
    
    def delete_all_lessons(self):
        from model import Lesson
        lessons = Lesson.fetch_all(filter_expr="teacher", filter_value=self.person)
        for lesson in lessons:
            self.delete_lesson(lesson, False)
            self.log_out_all_students(lesson, False);
        self.write_response_plain_text("OK")
             
    def log_out_student(self, student, write_response=True):
        student.log_out(True)
        if write_response:
            self.write_response_plain_text("OK")
                   
    def log_out_all_students(self, lesson=None, write_response=True):
        
        assert self.is_teacher, "Must be logged in as teacher"
        if lesson is None:
            allLessonsForAllTeachers = self.request.get("which_lessons", "0") == "1"
            if allLessonsForAllTeachers:
                assert self.is_teacher and self.person.admin, "Must be admin to logout students from all lessons for all teachers."
        
        from model import Student
        if lesson is not None:
            students = tuple(Student.all().filter("lesson =", lesson))
        elif allLessonsForAllTeachers:
            students = Student.all()
        else:
            students = tuple(Student.all().filter("teacher =", self.person))
            
        for student in students:
            if student.is_logged_in or len(student.client_ids) > 0:
                from helpers import log
                log("Teacher logged out {0} from lesson {1}".format(student.nickname, student.lesson.lesson_code))
                self.log_out_student(student, False)
          
        if write_response:      
            self.write_response_plain_text("OK")

    def make_lesson_code(self):
        import random
        from model import Lesson
        digits = 5
        
        # This is essentially a do loop, but I'm using a generous upper bound to prevent the
        # possibility of an endless (and potentially costly) spin, in case of a bug, for example.
        for i in range(1000):
            assert i < 1000 - 1, "Looks like infinite loop."
            n = random.randint(0,10**digits - 1)
            lesson_code = "%05d"%n
            lesson = Lesson.get_by_key_name(lesson_code)
            if lesson is None:
                break
        return lesson_code
    
class NotAnAuthenticatedTeacherError(Exception): pass
