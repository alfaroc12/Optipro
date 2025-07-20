# from rest_framework import serializers
# from technical_visit.models.technical_visit_question import M_technical_visit_question
# from technical_visit.models.technical_question import M_technical_question

# class sz_technical_visit_question(serializers.ModelSerializer):
#     technical_question_id = serializers.PrimaryKeyRelatedField(queryset=M_technical_question.objects.all())
#     class Meta:
#         model = M_technical_visit_question
#         fields = [
#             'id',
#             'technical_question_id',
#             'active',
#             'description',
#         ]


# class sz_technical_visit_question_fk(serializers.ModelSerializer):
#     # technical_visit_id = sz_technical_visit_fk(source='technical_visit_id.code', read_only=True)
#     # technical_question_id = sz_technical_question_fk(read_only=True)
#     class Meta:
#         model = M_technical_visit_question
#         fields = [
#             'id',
#             'technical_question_id',
#             'technical_visit_id',
#         ]
        
#         read_only_fields = fields


# class sz_technical_visit_question_list(serializers.ModelSerializer):
#     # from .sz_technical_question import sz_technical_question_fk
#     # from .sz_technical_visit import sz_technical_visit_fk

#     # technical_question_id = sz_technical_question_fk(source='technical_quiestion_id.description', read_only=True)
#     # technical_visit_id = sz_technical_visit_fk(source='technical_visit_id.code', read_only=True)
#     class Meta:
#         model = M_technical_visit_question
#         fields = [
#             'id',
#             'technical_question_id',
#             'technical_visit_id',
#             'active',
#             'description',
#         ]

#         read_only_fields = fields


# class sz_technical_visit_question_retrive(serializers.ModelSerializer):
#     from .sz_technical_question import sz_technical_question_fk

#     technical_question = sz_technical_question_fk(source='technical_quiestion_id.description', read_only=True)
#     technical_visit = serializers.CharField(source='technical_visit_id.code', read_only=True)
#     class Meta:
#         model = M_technical_visit_question
#         fields = [
#             'id',
#             'technical_question_id',
#             'technical_visit_id',
#             'active',
#             'description',
#             'technical_question',
#             'technical_visit',
#         ]
#         read_only_fields = [
#             'id',
#             'technical_question_id',
#             'technical_visit_id',
#             'technical_question',
#             'technical_visit',
#         ]