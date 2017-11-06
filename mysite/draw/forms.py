# coding:utf-8
from django import forms
# LAYOUT_CHOICES = (
#     ('spring', 'spring'),
#     ('random', 'random'),
#     ('spectral', 'spectral'),
#     ('shell', 'shell'),
#     ('circular', 'circular'),
# )
CLUSTERING_METHOD_CHOICES = (
    ('modularity', 'modularity'),
    ('ip_seg', 'ip_seg'),
)
IP_SEG_CHOICES = (
    ('1','1'),
    ('2','2'),
    ('3','3'),
    ('4','4'),
)

class UploadFileForm(forms.Form):
    upload_file = forms.FileField(label="upload_file",
                                  widget=forms.FileInput(attrs={'class': 'test_form', 'text':'please'}))

class SettingsForm(forms.Form):
    clustering_method = forms.ChoiceField(label='clustering_method',
                                          required=True,
                                          choices=CLUSTERING_METHOD_CHOICES,
                                          widget=forms.RadioSelect(attrs={'class': 'clustering_method'}))
    choose_ip_seg = forms.ChoiceField(label='choose_ip_seg',
                                      choices=IP_SEG_CHOICES,
                                      widget=forms.RadioSelect(attrs={'class': 'choose_ip_seg'}))
    with_node_style = forms.BooleanField(label="with_node_style",
                                    widget=forms.NullBooleanSelect(attrs={'class': 'with_node_style'}))
    # layout = forms.ChoiceField(label="layout",
    #                            choices=LAYOUT_CHOICES,
    #                            widget=forms.RadioSelect(attrs={'class': 'layout'}))
    # colorful = forms.BooleanField(label="colorful",
    #                               widget=forms.NullBooleanSelect(attrs={'class': 'colorful'}))
    # with_weight = forms.BooleanField(label="with_weight",
    #                                  widget=forms.CheckboxInput(attrs={'class': 'with_weight'}))
