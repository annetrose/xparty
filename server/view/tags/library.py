from server.view import custom_templates
from google.appengine.ext.webapp import template
import os

register = template.create_template_register()

@register.filter
def init_activity_types_js(tmp=None):
    # TODO: Filters require at least 1 variable to be passed in
    # Tried implementing as an inclusion_tag (which does not require a variable) but
    # then only one of the two template directories could find it
    activity_types= []
    for template_file in os.listdir(os.path.dirname(custom_templates.__file__)):
        if template_file.startswith("student_") and template_file.endswith(".html"):
            activity_type = template_file.replace("student_","").replace(".html", "")
            activity_types.append({ 'type' : activity_type, 'description' : activity_type.replace("_"," ").title() })
    tag_file = os.path.join(os.path.dirname(__file__), 'activity_type_js.html')
    return template.render(tag_file, { 'activity_types' : activity_types })

@register.filter
def init_activities_js(activities):    
    tag_file = os.path.join(os.path.dirname(__file__), 'activity_js.html')
    return template.render(tag_file, { 'activities' : activities, 'list' : True })

@register.filter
def init_activity_js(activity):
    activities = []
    activities.append(activity)
    tag_file = os.path.join(os.path.dirname(__file__), 'activity_js.html')
    return template.render(tag_file, { 'activities' : activities, 'list' : False })

@register.filter
def init_students_js(students):
    tag_file = os.path.join(os.path.dirname(__file__), 'student_js.html')
    return template.render(tag_file, { 'students' : students, 'list' : True })

@register.filter
def init_student_js(student):
    students = []
    students.append(student)
    tag_file = os.path.join(os.path.dirname(__file__), 'student_js.html')
    return template.render(tag_file, { 'students' : students, 'list' : False })

@register.filter
def init_task_histories_js(histories):
    tag_file = os.path.join(os.path.dirname(__file__), 'task_history_js.html')
    return template.render(tag_file, { 'task_histories' : histories })