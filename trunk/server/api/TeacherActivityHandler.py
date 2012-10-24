# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created October 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyHandler import XPartyHandler
from server import exceptions
from server import model_access
from server.utils import helpers
import datetime, time, StringIO
        
class TeacherActivityHandler(XPartyHandler):
    def post(self):        
        try:       
            self.init_user_context("teacher") 
            action = self.request.get("action", "")
            lesson_code = self.request.get("lesson_code", "")
            lesson = model_access.get_lesson(lesson_code) if lesson_code != "" else None
            response_data = { "status": 1 }
                    
            # Actions that only require an authenticated user
            if exceptions.NotAnAuthenticatedTeacherError.check(self.user):
                raise exceptions.NotAnAuthenticatedTeacherError()
                                               
            elif action == "create":
                response_data = self.create_edit_lesson()
    
            elif action == "stop_all":
                lessons = model_access.get_lessons(self.user)
                for lesson in lessons:
                    model_access.stop_lesson(lesson)
             
            elif action == "delete_all":
                lessons = model_access.get_lessons(self.user)
                for lesson in lessons:
                    model_access.delete_lesson(lesson)
                    self.log_out_all_students(lesson)
            
            elif action == "log_out_all_students":                    
                all_students_for_all_teachers = self.request.get("which_lessons", "0") == "1"
                if exceptions.NotAnAuthenticatedAdminError.check(self.user):
                    raise exceptions.NotAnAuthenticatedAdminError()
                self.log_out_all_students(lesson, all_students_for_all_teachers)
                    
            # Actions that require an authenticated user and permission to access to specified activity
            elif exceptions.ActivityNotFoundError.check(lesson):
                raise exceptions.ActivityNotFoundError()
              
            elif exceptions.ActivityAccessDeniedError.check(self.user, lesson):
                raise exceptions.ActivityAccessDeniedError()
        
            elif action == "edit":
                response_data = self.create_edit_lesson(lesson)
    
            elif action == "start":
                model_access.start_lesson(lesson)
                           
            elif action == "stop":
                model_access.stop_lesson(lesson)
                      
            elif action == "clone":
                clone = model_access.copy_lesson(lesson)
                response_data["clone"] = clone.to_dict();
                  
            elif action == "clear":
                model_access.clear_lesson(lesson)
                self.log_out_all_students(lesson)
    
            elif action == "delete":                    
                model_access.delete_lesson(lesson)
                self.log_out_all_students(lesson)
                
            elif action == "log_out_student":
                student_nickname = self.request.get("student_nickname")
                student = model_access.get_student(student_nickname=student_nickname, lesson_code=lesson_code)
                model_access.log_out_person(student)
            
            else:
                raise exceptions.UnknownActionError()

            self.write_response_as_json(response_data)
                
        except exceptions.XPartyException as e:
            e.write_response_as_json(self)
                    
    def get(self):        
        try:      
            self.init_user_context("teacher")
            action = self.request.get("action", "")
            lesson_code = self.request.get("lesson_code", "")
            lesson = model_access.get_lesson(lesson_code) if lesson_code != "" else None

            if exceptions.NotAnAuthenticatedTeacherError.check(self.user):
                raise exceptions.NotAnAuthenticatedTeacherError()
            
            elif exceptions.ActivityNotFoundError.check(lesson):
                raise exceptions.ActivityNotFoundError()
            
            elif exceptions.ActivityAccessDeniedError.check(self.user, lesson):
                raise exceptions.ActivityAccessDeniedError()
                    
            if action == "download":
                # current implementation does not work if post request
                # response written as file
                utc_offset_minutes = int(self.request.get("utc_offset_minutes", 0))
                utc_offset = datetime.timedelta(minutes=utc_offset_minutes)
                self.download_lesson(lesson, utc_offset)                
            else:
                raise exceptions.UnknownActionError()
                
        except exceptions.XPartyException as e:
            e.write_response_as_json(self)
              
    def create_edit_lesson(self, lesson=None):
        activity_type = self.request.get("activity_type")
        lesson_title = self.request.get("lesson_title")
        lesson_description = self.request.get("lesson_description")
        class_name = self.request.get("class_name")
        task_infos = []
        for task_num in range(1, int(self.request.get("max_num_tasks", "1"))+1):
            task_title = self.request.get("task_title_%d"%task_num)
            task_description = self.request.get("task_description_%d"%task_num)
            if task_title != "":
                task_infos.append((task_title, task_description))
        tasks_json = helpers.to_json(task_infos)
        
        if (len(activity_type) == 0) or (len(lesson_title) == 0) or (len(task_infos) == 0):
            return { "status": 0, "msg": "Activity type, activity name, and one task are required." }
         
        else: 
            data = {
                'activity_type' : activity_type,
                'title'         : lesson_title,
                'class_name'    : class_name,
                'description'   : lesson_description,
                'tasks_json'    : tasks_json
            }   
            if lesson is None:
                data["teacher"] = self.user
                
            lesson = model_access.create_lesson(data) if lesson is None else model_access.update_lesson(lesson, data)
            return { "status": 1, "lesson": lesson.to_dict() }
    
    def download_lesson(self, lesson, utc_offset):
        headers = (
            "Timestamp",
            "Student",
            "Task_Number",
            "Task_Name",
            "Activity_Type",
            "Activity_Data"
        )
        report_buffer = StringIO.StringIO()
        excel_writer = UnicodeWriter(report_buffer, "excel-tab", "utf8")
        excel_writer.writerow(headers)

        # TODO: Currently activity data is imported as json string 
        # There are extra quotes when viewed as plain text. 
        # It is correct when imported in Excel.
        # How should it be stored?
        
        task_titles = tuple(task_info[0] for task_info in lesson.tasks)
        actions = model_access.get_student_actions(lesson)
        for action in actions:
            student = action.student
            timestamp = (action.timestamp - utc_offset).strftime("%m/%d/%Y %H:%M:%S")
            task_idx = action.task_idx
            task_title = task_titles[task_idx]
            task_num = task_idx + 1
            line_parts = (
                timestamp,
                student.nickname,
                task_num,
                task_title,
                action.action_type,
                action.action_data_json
            )
            excel_writer.writerow(line_parts)
                
        report_text = report_buffer.getvalue()
        report_buffer.close()

        content_type = "text/tab-separated-values"
        filename = "xparty_activity_%s_as_of_%s.txt"%(lesson.lesson_code, time.strftime("%Y%m%d-%H%M%S"))
        self.write_response_as_file(encoded_content=report_text, content_type=content_type, filename=filename, encoding="UTF-8")
        
    def log_out_all_students(self, lesson=None, all_students_for_all_teachers=False):
        if lesson is not None:
            students = model_access.get_students(lesson=lesson, only_logged_in=True)
        elif all_students_for_all_teachers:
            students = model_access.get_students(only_logged_in=True)
        else:
            students = None
            
        for student in students:
            model_access.log_out_person(student)
            
# UnicodeWriter class was taken directly from Python documentation for the csv module.
# (c) Copyright 1990-2011, Python Software Foundation
# Licensed under same license as Python itself.
# Slightly modified by Alex Quinn on 12-12-2011.
class UnicodeWriter:
    """
    A CSV writer which will write rows to CSV file "f",
    which is encoded in the given encoding.
    """
    import csv

    def __init__(self, f, dialect=csv.excel, encoding="utf-8", **kwds):
        import codecs, csv
        # Redirect output to a queue
        self.queue = StringIO.StringIO()
        self.writer = csv.writer(self.queue, dialect=dialect, **kwds)
        self.stream = f
        self.encoder = codecs.getincrementalencoder(encoding)()

    def writerow(self, row):
        self.writer.writerow([unicode(s).encode("utf-8") for s in row])
        # Fetch UTF-8 output from the queue ...
        data = self.queue.getvalue()
        data = data.decode("utf-8")
        # ... and reencode it into the target encoding
        data = self.encoder.encode(data)
        # write to the target stream
        self.stream.write(data)
        # empty queue
        self.queue.truncate(0)