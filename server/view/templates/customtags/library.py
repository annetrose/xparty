import os
from google.appengine.ext.webapp import template

register = template.create_template_register()

@register.filter
def init_lessons_js(lessons):    
    tag_file = os.path.join(os.path.dirname(__file__), 'lesson_js.html')
    return template.render(tag_file, { 'lessons' : lessons })

@register.filter
def init_lesson_js(lesson):
    lessons = []
    lessons.append(lesson)
    tag_file = os.path.join(os.path.dirname(__file__), 'lesson_js.html')
    return template.render(tag_file, { 'lessons' : lessons })

@register.filter
def init_students_js(students):
    tag_file = os.path.join(os.path.dirname(__file__), 'student_js.html')
    return template.render(tag_file, { 'students' : students })

@register.filter
def init_student_js(student):
    students = []
    students.append(student)
    tag_file = os.path.join(os.path.dirname(__file__), 'student_js.html')
    return template.render(tag_file, { 'students' : students })

@register.filter
def init_task_histories_js(histories):
    tag_file = os.path.join(os.path.dirname(__file__), 'task_history_js.html')
    return template.render(tag_file, { 'task_histories' : histories })

    