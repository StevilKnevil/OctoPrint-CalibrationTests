
def generateBrim():
    return ""

def generateObj():
    return ""

def generateGcode(_logger, startTime, endTime, steps):
    _logger.info("coolingTest")
    # TODO: preamble/postamble shoulnd't be part of the test
    #const preamble = generatePreamble()
    brim = generateBrim()
    obj = generateObj()
    #const obj = generateObj()
    return brim + obj
