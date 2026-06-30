from pie_server.qti import parse_qti, qti_to_exam

QTI = """
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
  <qti-assessment-item identifier="essay1" title="Essay">
    <qti-item-body>
      <p>Explain provenance.</p>
      <qti-extended-text-interaction response-identifier="RESPONSE"/>
    </qti-item-body>
  </qti-assessment-item>
  <qti-assessment-item identifier="mc1" title="MC">
    <qti-item-body>
      <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
        <qti-prompt>Pick the best signal.</qti-prompt>
        <qti-simple-choice identifier="A">Mouse velocity</qti-simple-choice>
        <qti-simple-choice identifier="B">Page Visibility</qti-simple-choice>
      </qti-choice-interaction>
    </qti-item-body>
  </qti-assessment-item>
</qti-assessment-test>
"""


def test_parse_qti_text_and_choice():
    questions = parse_qti(QTI)
    assert len(questions) == 2

    essay = questions[0]
    assert essay["id"] == "essay1"
    assert essay["kind"] == "text"
    assert essay["prompt"] == "Explain provenance."

    mc = questions[1]
    assert mc["id"] == "mc1"
    assert mc["kind"] == "choice"
    assert mc["prompt"] == "Pick the best signal."
    assert mc["options"] == ["Mouse velocity", "Page Visibility"]


def test_parse_single_item():
    one = """<qti-assessment-item identifier="solo" title="Solo">
      <qti-item-body><p>Just one.</p></qti-item-body></qti-assessment-item>"""
    questions = parse_qti(one)
    assert questions == [{"id": "solo", "prompt": "Just one.", "kind": "text"}]


def test_qti_to_exam_wraps_metadata():
    exam = qti_to_exam(QTI, exam_id="exam-7", title="Imported", duration_seconds=600)
    assert exam["id"] == "exam-7"
    assert exam["title"] == "Imported"
    assert exam["durationSeconds"] == 600
    assert len(exam["questions"]) == 2
