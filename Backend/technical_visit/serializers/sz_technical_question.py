from rest_framework import serializers
from technical_visit.models.technical_question import M_technical_question 

class sz_technical_question(serializers.ModelSerializer):
    class Meta:
        model = M_technical_question
        fields = [
            'id',
            'Q_1',
            'Q_1_comentary',
            'Q_2',
            'Q_2_comentary',
            'Q_3',
            'Q_3_comentary',
            'Q_4',
            'Q_4_comentary',
            'Q_5',
            'Q_5_comentary',
            'Q_6',
            'Q_6_comentary',


        ]

class sz_technical_question_fk(serializers.ModelSerializer):
    class meta:
        model = M_technical_question
        fields = [
            'id',
            'Q_1',
            'Q_2',
            'Q_3',
            'Q_4',
            'Q_5',
            'Q_6',
        ]
        read_only_fields = fields

class sz_technical_question_list(serializers.ModelSerializer):
    class Meta:
        model = M_technical_question
        fields = [
            'id',
            'Q_1',
            'Q_1_comentary',
            'Q_2',
            'Q_2_comentary',
            'Q_3',
            'Q_3_comentary',
            'Q_4',
            'Q_4_comentary',
            'Q_5',
            'Q_5_comentary',
            'Q_6',
            'Q_6_comentary',
        ]
        read_only_fields = fields

class sz_technical_question_retrive(serializers.ModelSerializer):
    class Meta:
        model = M_technical_question
        fields = [
            'id',
            'Q_1',
            'Q_1_comentary',
            'Q_2',
            'Q_2_comentary',
            'Q_3',
            'Q_3_comentary',
            'Q_4',
            'Q_4_comentary',
            'Q_5',
            'Q_5_comentary',
            'Q_6',
            'Q_6_comentary',
        ]
        read_only_fields = [
            'id',
        ]

