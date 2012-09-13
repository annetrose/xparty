from google.appengine.ext.webapp import template
register = template.create_template_register()

@register.filter
def init_lessons_js(lessons):
    return template.render('customtags/lesson_js.html', { 'lessons' : lessons })

@register.filter
def init_lesson_js(lesson):
    lessons = []
    lessons.append(lesson)
    return template.render('customtags/lesson_js.html', { 'lessons' : lessons })

@register.filter
def init_students_js(students):
    return template.render('customtags/student_js.html', { 'students' : students })

@register.filter
def init_student_js(student):
    students = []
    students.append(student)
    return template.render('customtags/student_js.html', { 'students' : students })