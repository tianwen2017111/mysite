# coding: utf-8
from __future__ import unicode_literals
from django.db import models


class UploadFile(models.Model):
    #           id:主键 自增
    #        fName:文件名
    #    TimeStamp: 创建时间
    #    Data     : 数据内容
    #    fPath    : 文件路径
    filename = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now=True)
    file = models.FileField(upload_to="./upload")
    filepath = models.FilePathField(path="./upload")

    def __unicode__(self):
        return self.filename

    def __unicode__(self):
        return self.timestamp

    def __unicode__(self):
        return self.filepath

# class UploadFile(models.Model):
#     id = models.IntegerField(primary_key=True)  # AutoField?
#     filename = models.CharField(max_length=50)
#     file = models.CharField(max_length=100)
#     filepath = models.CharField(max_length=100)
#     timestamp = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'draw_uploadfile'

#
# class AuthGroup(models.Model):
#     id = models.IntegerField(primary_key=True)  # AutoField?
#     name = models.CharField(unique=True, max_length=80)
#
#     class Meta:
#         managed = False
#         db_table = 'auth_group'
#
#
# class AuthGroupPermissions(models.Model):
#     id = models.IntegerField(primary_key=True)  # AutoField?
#     group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
#     permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)
#
#     class Meta:
#         managed = False
#         db_table = 'auth_group_permissions'
#         unique_together = (('group', 'permission'),)
#
#
# class AuthPermission(models.Model):
#     id = models.IntegerField(primary_key=True)  # AutoField?
#     content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
#     codename = models.CharField(max_length=100)
#     name = models.CharField(max_length=255)
#
#     class Meta:
#         managed = False
#         db_table = 'auth_permission'
#         unique_together = (('content_type', 'codename'),)
#
#
# class AuthUser(models.Model):
#     id = models.IntegerField(primary_key=True)  # AutoField?
#     password = models.CharField(max_length=128)
#     last_login = models.DateTimeField(blank=True, null=True)
#     is_superuser = models.BooleanField()
#     first_name = models.CharField(max_length=30)
#     last_name = models.CharField(max_length=30)
#     email = models.CharField(max_length=254)
#     is_staff = models.BooleanField()
#     is_active = models.BooleanField()
#     date_joined = models.DateTimeField()
#     username = models.CharField(unique=True, max_length=150)
#
#     class Meta:
#         managed = False
#         db_table = 'auth_user'
#
#
# class AuthUserGroups(models.Model):
#     id = models.IntegerField(primary_key=True)  # AutoField?
#     user = models.ForeignKey(AuthUser, models.DO_NOTHING)
#     group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
#
#     class Meta:
#         managed = False
#         db_table = 'auth_user_groups'
#         unique_together = (('user', 'group'),)
#
#
# class AuthUserUserPermissions(models.Model):
#     id = models.IntegerField(primary_key=True)  # AutoField?
#     user = models.ForeignKey(AuthUser, models.DO_NOTHING)
#     permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)
#
#     class Meta:
#         managed = False
#         db_table = 'auth_user_user_permissions'
#         unique_together = (('user', 'permission'),)
#
#
# class DjangoAdminLog(models.Model):
#     id = models.IntegerField(primary_key=True)  # AutoField?
#     object_id = models.TextField(blank=True, null=True)
#     object_repr = models.CharField(max_length=200)
#     action_flag = models.PositiveSmallIntegerField()
#     change_message = models.TextField()
#     content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
#     user = models.ForeignKey(AuthUser, models.DO_NOTHING)
#     action_time = models.DateTimeField()
#
#     class Meta:
#         managed = False
#         db_table = 'django_admin_log'
#
#
# class DjangoContentType(models.Model):
#     id = models.IntegerField(primary_key=True)  # AutoField?
#     app_label = models.CharField(max_length=100)
#     model = models.CharField(max_length=100)
#
#     class Meta:
#         managed = False
#         db_table = 'django_content_type'
#         unique_together = (('app_label', 'model'),)
#
#
# class DjangoMigrations(models.Model):
#     id = models.IntegerField(primary_key=True)  # AutoField?
#     app = models.CharField(max_length=255)
#     name = models.CharField(max_length=255)
#     applied = models.DateTimeField()
#
#     class Meta:
#         managed = False
#         db_table = 'django_migrations'
#
#
# class DjangoSession(models.Model):
#     session_key = models.CharField(primary_key=True, max_length=40)
#     session_data = models.TextField()
#     expire_date = models.DateTimeField()
#
#     class Meta:
#         managed = False
#         db_table = 'django_session'





# class ipInfo(models.Model):
#     id = models.IntegerField(primary_key=True)
#     ip = models.CharField(max_length=20)
#     information = models.CharField(max_length=100)
#
#     class Meta:
#         managed = False