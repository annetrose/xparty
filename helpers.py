# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#		  Alex Quinn - www.cs.umd.edu/~aq
#		  Anne Rose - www.cs.umd.edu/hcil/members/~arose
#		  University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
	
def calc_since_time(since_str):
	from datetime import datetime, timedelta, MINYEAR
	# default is Today
	now = datetime.now()
	since_time = datetime(now.year, now.month, now.day, 0)
	if since_str == "1":		# The beginning
		since_time = datetime(MINYEAR, 1, 1)
	elif since_str == "2":		# Last week
		day_of_week = since_time.weekday()
		since_time -= timedelta(days=(day_of_week + 7))
	elif since_str == "3":		# This week
		day_of_week = since_time.weekday()
		since_time -= timedelta(days=day_of_week)
	elif since_str == "4":		# Yesterday
		since_time -= timedelta(days=1)
	return since_time

def timestamp():
	import time
	return time.strftime("%Y%m%d-%H%M%S")
			
def to_str_if_ascii(s):
	if isinstance(s, basestring):
		try:
			s = str(s)
		except UnicodeEncodeError:
			pass
	return s

def log(msg):
	import logging, settings
	if settings.ENABLE_DEBUG_LOGGING:
		logging.getLogger().info(msg)

def path_for_filename(filename):
	import os
	base_dir = os.path.dirname(os.path.abspath(__file__))
	path = os.path.join(base_dir, filename)
	path = os.path.abspath(path)
	return path

def read_file(filename, encoding="utf8"):
	import codecs
	path = path_for_filename(filename)
	infile = codecs.open(path, "r", encoding)
	try:
		file_contents = infile.read()
	finally:
		infile.close()
	return file_contents
			
def prettify_html(html):
	try:
		from BeautifulSoup import BeautifulSoup
		return BeautifulSoup(html).prettify()
	except ImportError:  # quietly fail if BeautifulSoup module is not found
		return html

def smush(s, to_length, num_dots=3):
	"""
	Truncate a string from the middle.
	"""
	if not isinstance(s, basestring):
		s = str(s)
	s_len = len(s)
	if s_len > to_length:
		front_len = int((to_length - num_dots) / 2)
		back_len = to_length - num_dots - front_len
		s = s[:front_len] + "."*num_dots + s[-back_len:]
	return s

def chop(s, to_length, num_dots=3):
	"""
	Truncate a string from the end.
	"""
	if not isinstance(s, basestring):
		s = str(s)
	s_len = len(s)
	if s_len > to_length:
		front_len = to_length - num_dots
		s = s[:front_len] + "."*num_dots
	return s

def get_one_or_none(iterable, default=None):
	items = tuple(iterable)
	if len(items)==1:
		return items[0]
	elif len(items)==0:
		return default
	else:
		raise ValueError("Expected either 0 or 1 items.  Found %d items. : %r"%(len(items), items))
