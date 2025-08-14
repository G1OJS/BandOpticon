
import matplotlib.pyplot as plt
import pickle
import operator
with open("decodes.pkl",'rb') as f:
    decodes = pickle.load(f)

plt.ion()
fig, ax1 = plt.subplots()
ax2 = ax1.twinx()
ax1.set_xlabel("Callsign")
ax1.set_ylabel("SNR (dB)")
ax2.set_ylabel("Distance (km)")
art = False

f_all = 14074000
txCalls = set()
for d in decodes:
    if(abs(float(d['f'])-f_all)>10000):
        continue
    txCalls.add(d['sc'])

default_colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']

x = []
y = []
cols = []
alpha = []

for i, d in enumerate(decodes):
    x.append(d['sc'])
    y.append(d['rp'])
    cols.append("red" if d['rc']=="G1OJS" else default_colors[i % len(default_colors)])
    alpha.append(0.9 if d['rc']=="G1OJS" else 0.3)

z = list(zip(x,y,cols,alpha))
res = sorted(z, key = operator.itemgetter(1), reverse=True)
x,y,cols,alpha = zip(*res)


if(art):
    art.remove()
    
art = ax1.scatter(x,y, c = cols, alpha = alpha)

plt.show()






