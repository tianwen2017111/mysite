from django.conf.urls import url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf.urls.static import static
from django.conf import settings
from . import views

urlpatterns = [
    url(r'^home/$', views.home, name='home'),
    url(r'^charts/$', views.charts, name='charts'),
    url(r'^file/download.gml$', views.download, name='download'),
    url(r'^data.tsv$', views.dataTsv, name='dataTsv'),
    url(r'^fileupload/$', views.fileupload, name='fileupload'),
]

urlpatterns += staticfiles_urlpatterns()
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)