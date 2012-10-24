from server.view import custom_templates
from google.appengine.ext.webapp import template
import os

register = template.create_template_register()

@register.filter
def init_activity_types_js(foo=None):
    activity_types= []
    for template_file in os.listdir(os.path.dirname(custom_templates.__file__)):
        if template_file.startswith("student_") and template_file.endswith(".html"):
            activity_type = template_file.replace("student_","").replace(".html", "")
            activity_types.append({ 'type' : activity_type, 'description' : activity_type.replace("_"," ").title() })
    tag_file = os.path.join(os.path.dirname(__file__), 'activity_type_js.html')
    return template.render(tag_file, { 'activity_types' : activity_types })

@register.filter
def init_lessons_js(lessons):    
    tag_file = os.path.join(os.path.dirname(__file__), 'lesson_js.html')
    return template.render(tag_file, { 'lessons' : lessons, 'list' : True })

@register.filter
def init_lesson_js(lesson):
    lessons = []
    lessons.append(lesson)
    tag_file = os.path.join(os.path.dirname(__file__), 'lesson_js.html')
    return template.render(tag_file, { 'lessons' : lessons, 'list' : False })

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

# Example: {{ activity_type|init_task_area }}
#@register.filter
#def init_task_area(activity_type):
#    template_file = activity_type+".html" if activity_type is not None else "default.html"
#    tag_file = os.path.join(os.path.dirname(modules.__file__), template_file)
#    return template.render(tag_file, {})