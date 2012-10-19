# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from server.model_access import get_students, log_out_person
import webapp2

# Runs as cronjob, specified in cron.yaml
# Admin access required, specified in app.yaml
class StudentsTimeoutHandler(webapp2.RequestHandler):
    def get(self):
        students = get_students(only_logged_in=True)
        for student in students:
            if student.is_session_timed_out:
                log_out_person(student)


