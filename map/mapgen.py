import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature

# Create figure in equirectangular projection
fig = plt.figure(figsize=(12, 6) , facecolor="white")
ax = plt.axes(projection=ccrs.PlateCarree())

ax.set_global()
ax.coastlines(resolution="110m", linewidth=0.5, color="black", alpha=0.7)
ax.add_feature(cfeature.BORDERS, linewidth=0.3, edgecolor="black", alpha=0.4)
ax.set_axis_off()

plt.show()
