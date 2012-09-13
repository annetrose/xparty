# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#		  Alex Quinn - www.cs.umd.edu/~aq
#		  Anne Rose - www.cs.umd.edu/hcil/members/~arose
#		  University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class DataDump(XPartyRequestHandler):
	def get(self):
		import datetime
		self.load_xparty_context(user_type="teacher")

		if not self.is_teacher:
			self.redirect_to_teacher_login()
		else:
			lesson_code = self.request.get("lesson_code", None)
			assert lesson_code is not None
			utc_offset_minutes = int(self.request.get("utc_offset_minutes", 0))
			utc_offset = datetime.timedelta(minutes=utc_offset_minutes)
			self._send_tab_delimited_report(lesson_code=lesson_code, utc_offset=utc_offset)
	
	def _send_tab_delimited_report(self, lesson_code, utc_offset):
		import StringIO
		from model import Student, StudentActivity, Lesson
		import helpers
		encoding = "UTF-8"

		lesson = Lesson.get_by_key_name(lesson_code)
		assert lesson is not None

		if lesson is None or lesson.teacher_key != self.teacher_key:
			self.write_response_plain_text("ERROR:  Lesson code appears to be incorrect.")
		else:

			students = Student.fetch_all("lesson =", lesson)
			task_titles = tuple(task_info[0] for task_info in lesson.tasks)
			student_key_to_nickname = dict((s.key().name(), s.nickname) for s in students)
			activities = StudentActivity.fetch_all("lesson =", lesson)

			report_buffer = StringIO.StringIO()
			excel_writer = UnicodeWriter(report_buffer, "excel-tab", "utf8")

			# TODO: Need to handle generic activity data
			headers = (
					"Timestamp",
					"Student",
					"Task_Number",
					"Task_Name",
					"Activity_Type"
			)
			excel_writer.writerow(headers)

			for activity in activities:
				student_key = activity.student_key.name()
				student_nickname = student_key_to_nickname[student_key]
				timestamp = (activity.timestamp - utc_offset).strftime("%m/%d/%Y %H:%M:%S")
				task_idx = activity.task_idx
				task_title = task_titles[task_idx]
				task_num = task_idx + 1
				# TODO: Need to handle generic activity data
				line_parts = (
						timestamp,
						student_nickname,
						task_num,
						task_title,
						activity.activity_type
				)
				excel_writer.writerow(line_parts)
				
			report_text = report_buffer.getvalue()
			report_buffer.close()

			content_type = "text/tab-separated-values"
			filename = "xparty_activity_%s_as_of_%s.txt"%(lesson_code, helpers.timestamp())
			self.write_response_as_file(encoded_content=report_text, content_type=content_type, filename=filename, encoding=encoding)

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
		import StringIO, codecs, csv
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

	def writerows(self, rows):
		for row in rows:
			self.writerow(row)
