# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-04-13 09:06
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('draw', '0004_auto_20170413_1523'),
    ]

    operations = [
        migrations.AlterField(
            model_name='uploadfile',
            name='upload file',
            field=models.FileField(upload_to='upload/'),
        ),
        migrations.AlterField(
            model_name='uploadfile',
            name='upload file path',
            field=models.FilePathField(path='upload/'),
        ),
    ]
