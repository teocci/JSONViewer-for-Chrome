build:
	dirname=$(shell basename $(PWD)); cd extension; zip -r ../$$dirname.zip .
