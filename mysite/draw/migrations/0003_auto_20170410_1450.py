# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-04-10 06:50
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('draw', '0002_auto_20170409_1921'),
    ]

    operations = [
        migrations.CreateModel(
            name='UploadFile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('upload_file', models.FileField(upload_to='./upload/')),
            ],
        ),
        migrations.DeleteModel(
            name='FileInfo',
        ),
    ]
