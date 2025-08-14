from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By

driver = webdriver.Chrome()
driver.get("http://hackgreensdr.org:8901/")

#freq = driver.find_element(By.NAME, "frequency")

freq = driver.find_element(By.XPATH, "/html/body/form[5]/div/input[1]")
freq.clear()
freq.send_keys("14074")
freq.send_keys(Keys.RETURN)

usb = driver.find_element(By.XPATH, "/html/body/div[5]/table/tbody/tr[1]/td[4]/input")
usb.click()

sound = driver.find_element(By.XPATH, "/html/body/form[4]/div/div/input")
sound.click()

