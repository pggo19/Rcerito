# Preguntas de prueba de Rcerito (45: 15 por examen).
# Cada pregunta se escribe con su respuesta correcta y sus distractores;
# build_questions.py reparte la letra correcta de forma pareja (A-D)
# y valida que las opciones tengan longitud parecida.
# Estado: "validada_ia" -> PENDIENTE de revisión médica antes de publicar en producción.

Q = []

def q(exam, area, subarea, tema, dif, tipo, enunciado, correcta, distractores, explicacion, fuente):
    Q.append(dict(exam=exam, area=area, subarea=subarea, tema=tema, dificultad=dif, tipo=tipo,
                  enunciado=enunciado, correcta=correcta, distractores=distractores,
                  explicacion=explicacion, fuente=fuente))

# ---------------------------------------------------------------- ESSALUD
q("ESSALUD", "Medicina", "Endocrino y metabolismo", "Cetoacidosis diabética", 2, "caso_clinico",
  "Varón de 19 años con diabetes tipo 1 llega con vómitos, dolor abdominal y respiración de Kussmaul. Glucosa 480 mg/dL, pH 7.12, HCO3 9 mEq/L, K 4.8 mEq/L, cetonemia positiva. PA 95/60 mmHg. ¿Cuál es la primera medida terapéutica?",
  "Cloruro de sodio 0.9 % en bolo endovenoso",
  [("Insulina regular en bolo antes de hidratar", "La insulina sin reponer volumen empeora la hipotensión y puede bajar el potasio; primero se hidrata."),
   ("Bicarbonato de sodio endovenoso en infusión", "El bicarbonato no se indica con pH mayor de 6.9; no mejora el pronóstico."),
   ("Potasio oral y control de glucosa en 2 h", "Es una emergencia con depleción de volumen; el manejo es endovenoso y en hospital.")],
  "En la cetoacidosis la prioridad es reponer el volumen con cristaloides isotónicos; la insulina en infusión se inicia después, con potasio mayor de 3.5 mEq/L.",
  {"documento": "ADA/EASD/JBDS/AACE/DTS. Hyperglycemic crises in adults with diabetes: a consensus report", "anio": 2024, "url": "https://diabetesjournals.org/care/article/47/8/1257/156808"})

q("ESSALUD", "Emergencias y cuidados críticos", "Medio interno", "Hiperpotasemia", 2, "caso_clinico",
  "Mujer de 66 años con enfermedad renal crónica estadio 4 acude por debilidad. Potasio sérico 7.1 mEq/L. El ECG muestra ondas T picudas y QRS ensanchado. ¿Cuál es el primer fármaco que debe administrarse?",
  "Gluconato de calcio al 10 % endovenoso",
  [("Furosemida endovenosa en dosis alta", "Baja el potasio lentamente y depende de la función renal; no protege el miocardio."),
   ("Resina de intercambio catiónico oral", "Actúa en horas; no sirve como primera medida ante cambios en el ECG."),
   ("Salbutamol inhalado como única medida", "Desplaza potasio al interior de la célula, pero no estabiliza la membrana cardiaca.")],
  "Con cambios electrocardiográficos se estabiliza primero la membrana del miocardio con calcio endovenoso; luego se redistribuye el potasio con insulina y glucosa o salbutamol.",
  {"documento": "UK Kidney Association. Clinical Practice Guidelines: Treatment of Acute Hyperkalaemia in Adults", "anio": 2023, "url": "https://ukkidney.org/health-professionals/guidelines/treatment-acute-hyperkalaemia-adults"})

q("ESSALUD", "Medicina", "Respiratorio", "Neumonía adquirida en la comunidad", 2, "caso_clinico",
  "Varón de 72 años con fiebre y tos productiva de 3 días. Está confuso. FR 32 por minuto, PA 85/50 mmHg, urea 58 mg/dL. Radiografía con consolidación lobar derecha. ¿Cuál es la conducta más adecuada?",
  "Hospitalizar y valorar ingreso a UCI",
  [("Tratamiento ambulatorio con amoxicilina oral", "Tiene CURB-65 de 5 puntos; el manejo ambulatorio es para 0 a 1 punto."),
   ("Observación por 6 horas y alta con antibiótico", "Confusión, taquipnea e hipotensión son criterios de gravedad que exigen hospitalización."),
   ("Repetir la radiografía en 48 horas y decidir", "Retrasar la decisión en un paciente con hipotensión aumenta la mortalidad.")],
  "Suma 5 puntos en CURB-65 (confusión, urea, frecuencia respiratoria, presión baja y edad de 65 o más): neumonía grave que requiere hospitalización y valoración por UCI.",
  {"documento": "ATS/IDSA. Diagnosis and Treatment of Adults with Community-acquired Pneumonia", "anio": 2019, "url": "https://www.atsjournals.org/doi/10.1164/rccm.201908-1581ST"})

q("ESSALUD", "Cirugía", "Cirugía general", "Apendicitis aguda", 1, "caso_clinico",
  "Varón de 22 años con dolor periumbilical de 18 horas que migró a fosa ilíaca derecha, náuseas y fiebre de 38.2 °C. Blumberg positivo, leucocitos 15 000/mm3. ¿Cuál es la conducta indicada?",
  "Apendicectomía con profilaxis antibiótica",
  [("Antibiótico oral y alta con control en 48 h", "Con peritonismo localizado y cuadro típico, el estándar sigue siendo la cirugía."),
   ("Colonoscopía de urgencia para confirmar", "La colonoscopía está contraindicada ante sospecha de apendicitis aguda."),
   ("Enema baritado y analgesia con opioides", "El enema no está indicado y puede favorecer la perforación.")],
  "El cuadro clásico (migración del dolor, fiebre, Blumberg y leucocitosis) indica apendicitis aguda; el tratamiento es la apendicectomía con antibiótico profiláctico.",
  {"documento": "WSES Jerusalem guidelines on diagnosis and treatment of acute appendicitis", "anio": 2020, "url": "https://wjes.biomedcentral.com/articles/10.1186/s13017-020-00306-3"})

q("ESSALUD", "Emergencias y cuidados críticos", "Trauma", "Trauma: evaluación primaria", 1, "caso_clinico",
  "Motociclista de 30 años llega tras un choque. Está inconsciente, con ronquido y sangre en la boca. PA 110/70 mmHg, FC 104 por minuto. ¿Cuál es la primera acción?",
  "Asegurar la vía aérea con control cervical",
  [("Colocar dos vías periféricas de grueso calibre", "Es parte de la circulación (C), que va después de la vía aérea."),
   ("Realizar ecografía FAST del abdomen", "La FAST es un complemento; no antecede al manejo de la vía aérea."),
   ("Solicitar tomografía cerebral sin contraste", "El paciente no puede ir a imágenes con una vía aérea en riesgo.")],
  "La evaluación primaria sigue el orden ABCDE: primero la vía aérea con restricción del movimiento de la columna cervical.",
  {"documento": "American College of Surgeons. ATLS Advanced Trauma Life Support, 10.ª ed.", "anio": 2018, "url": "https://www.facs.org/quality-programs/trauma/education/advanced-trauma-life-support/"})

q("ESSALUD", "Cirugía", "Quemados", "Quemaduras: superficie corporal", 1, "directa",
  "Un adulto sufre quemaduras de segundo grado en ambos miembros superiores completos y en toda la cara anterior del tronco. Según la regla de los nueve, ¿qué porcentaje de superficie corporal está quemada?",
  "36 %",
  [("27 %", "Solo sumaría un miembro superior y la cara anterior del tronco."),
   ("45 %", "Incluiría además la mitad posterior del tronco."),
   ("18 %", "Corresponde solo a los dos miembros superiores.")],
  "Cada miembro superior vale 9 % y la cara anterior del tronco 18 %: 9 + 9 + 18 = 36 %.",
  {"documento": "American Burn Association. Advanced Burn Life Support (ABLS) Provider Manual", "anio": 2018, "url": "https://ameriburn.org/education/abls-program/"})

q("ESSALUD", "Pediatría", "Niño y adolescente", "Deshidratación por diarrea", 2, "caso_clinico",
  "Niño de 2 años con diarrea líquida de 2 días. Está irritable, tiene ojos hundidos, bebe con avidez y el pliegue cutáneo regresa lentamente. ¿Qué plan de tratamiento corresponde?",
  "Plan B: SRO 75 ml/kg en 4 horas",
  [("Plan A: más líquidos en casa y signos de alarma", "El plan A es para niños sin deshidratación."),
   ("Plan C: hidratación endovenosa de inmediato", "El plan C es para deshidratación grave (letargo, no puede beber, pliegue muy lento)."),
   ("Ayuno de 6 horas y luego reiniciar la dieta", "El ayuno no está indicado y empeora la deshidratación.")],
  "Dos o más signos (irritabilidad, ojos hundidos, bebe ávidamente, pliegue lento) clasifican como algún grado de deshidratación: plan B con SRO en el establecimiento.",
  {"documento": "OMS. Tratamiento de la diarrea: manual clínico para los servicios de salud", "anio": 2005, "url": "https://iris.who.int/handle/10665/43209"})

q("ESSALUD", "Pediatría", "Niño y adolescente", "Bronquiolitis", 2, "caso_clinico",
  "Lactante de 4 meses con 3 días de rinorrea y tos. Hoy tiene sibilancias y crepitantes difusos. FR 48 por minuto, saturación 95 % al aire ambiente, se alimenta bien. ¿Cuál es el manejo recomendado?",
  "Medidas de soporte y aspiración nasal",
  [("Salbutamol nebulizado cada 20 minutos", "Los broncodilatadores no mejoran la evolución de la bronquiolitis."),
   ("Corticoide sistémico por cinco días", "Los corticoides no reducen ingresos ni duración de la enfermedad."),
   ("Amoxicilina oral por siete días", "Es una infección viral; el antibiótico no está indicado sin otra causa.")],
  "La bronquiolitis es viral y autolimitada; con buena saturación y alimentación el manejo es de soporte: aspiración nasal, hidratación y vigilancia de signos de alarma.",
  {"documento": "NICE NG9. Bronchiolitis in children: diagnosis and management", "anio": 2021, "url": "https://www.nice.org.uk/guidance/ng9"})

q("ESSALUD", "Pediatría", "Niño y adolescente", "Enfermedad de Kawasaki", 2, "caso_clinico",
  "Niño de 3 años con fiebre de 6 días, conjuntivitis bilateral sin secreción, labios rojos y fisurados, exantema polimorfo, edema de manos y adenopatía cervical de 2 cm. ¿Cuál es el tratamiento?",
  "Inmunoglobulina endovenosa y aspirina",
  [("Amoxicilina con ácido clavulánico oral", "No hay evidencia de infección bacteriana; el cuadro cumple criterios de Kawasaki."),
   ("Corticoides tópicos y antihistamínico", "No previene la complicación principal, que son los aneurismas coronarios."),
   ("Paracetamol y observación en el hogar", "Retrasar el tratamiento aumenta el riesgo de aneurismas coronarios.")],
  "Fiebre de 5 días o más con 4 de 5 criterios clínicos define Kawasaki; la inmunoglobulina endovenosa en los primeros 10 días reduce los aneurismas coronarios.",
  {"documento": "AHA. Diagnosis, Treatment, and Long-Term Management of Kawasaki Disease", "anio": 2017, "url": "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000484"})

q("ESSALUD", "Ginecología y obstetricia", "Obstetricia", "Preeclampsia con criterios de severidad", 1, "caso_clinico",
  "Gestante de 34 semanas con cefalea intensa y escotomas. PA 165/112 mmHg, proteinuria positiva. ¿Qué fármaco se usa para prevenir las convulsiones?",
  "Sulfato de magnesio endovenoso",
  [("Diazepam endovenoso en bolo", "Sirve para yugular una crisis, pero no es el fármaco de prevención en preeclampsia."),
   ("Fenitoína endovenosa de carga", "Es menos eficaz que el sulfato de magnesio para prevenir la eclampsia."),
   ("Nifedipino oral de liberación rápida", "Controla la presión, pero no previene las convulsiones.")],
  "El sulfato de magnesio es el fármaco de elección para prevenir y tratar la eclampsia; la presión se controla aparte con antihipertensivos.",
  {"documento": "ACOG Practice Bulletin 222. Gestational Hypertension and Preeclampsia", "anio": 2020, "url": "https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2020/06/gestational-hypertension-and-preeclampsia"})

q("ESSALUD", "Ginecología y obstetricia", "Obstetricia", "Hemorragia posparto", 1, "caso_clinico",
  "Puérpera de 25 años, 20 minutos después de un parto vaginal, presenta sangrado abundante. El útero está blando y por encima del ombligo. PA 100/60 mmHg. ¿Cuál es el manejo inicial?",
  "Oxitocina endovenosa y masaje uterino",
  [("Histerectomía obstétrica de emergencia", "Es el último recurso cuando fallan las medidas médicas y conservadoras."),
   ("Legrado uterino de forma inmediata", "No trata la atonía, que es la causa más frecuente."),
   ("Ácido tranexámico como única medida", "Se añade al manejo, pero no reemplaza al uterotónico.")],
  "Útero blando y sangrado posparto sugieren atonía; la primera línea es la oxitocina con masaje uterino, junto con la reanimación.",
  {"documento": "OMS. Recomendaciones para la prevención y el tratamiento de la hemorragia posparto", "anio": 2012, "url": "https://iris.who.int/handle/10665/75411"})

q("ESSALUD", "Ginecología y obstetricia", "Obstetricia", "Embarazo ectópico", 3, "caso_clinico",
  "Mujer de 28 años con 6 semanas de amenorrea y dolor pélvico leve. Hemodinámicamente estable. β-hCG 2 500 mUI/mL, ecografía transvaginal sin saco intrauterino y masa anexial de 3 cm sin latido. ¿Cuál es el manejo de elección?",
  "Metotrexato intramuscular en dosis única",
  [("Salpingectomía por laparotomía de emergencia", "Se reserva para la paciente inestable o con rotura."),
   ("Legrado uterino por aspiración manual (AMEU)", "No trata un embarazo de localización anexial."),
   ("Alta sin control seriado de β-hCG", "Toda opción no quirúrgica exige seguimiento de β-hCG hasta negativizar.")],
  "Paciente estable, masa menor de 3.5 cm, sin latido y β-hCG menor de 5 000: es buena candidata a metotrexato con control seriado de β-hCG.",
  {"documento": "ACOG Practice Bulletin 193. Tubal Ectopic Pregnancy", "anio": 2018, "url": "https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2018/03/tubal-ectopic-pregnancy"})

q("ESSALUD", "Emergencias y cuidados críticos", "Intoxicaciones", "Intoxicación por organofosforados", 1, "caso_clinico",
  "Agricultor de 40 años llega tras fumigar sin protección. Tiene miosis, sialorrea, broncorrea, bradicardia y fasciculaciones. ¿Cuál es el antídoto de primera línea?",
  "Atropina endovenosa",
  [("Naloxona endovenosa", "Es el antídoto de los opioides, que no causan sialorrea ni broncorrea."),
   ("Flumazenil endovenoso", "Revierte benzodiacepinas; no actúa sobre el exceso colinérgico."),
   ("N-acetilcisteína oral", "Es el antídoto del paracetamol.")],
  "Los organofosforados inhiben la acetilcolinesterasa; la atropina bloquea los receptores muscarínicos y se titula hasta secar las secreciones bronquiales.",
  {"documento": "Goodman & Gilman. Las bases farmacológicas de la terapéutica, 14.ª ed.", "anio": 2023, "url": ""})

q("ESSALUD", "Ciencias básicas", "Dinámicas", "Tétanos: mecanismo de la toxina", 2, "directa",
  "La tetanospasmina produce espasmos y rigidez muscular. ¿Cuál es su mecanismo de acción?",
  "Bloquea la liberación de glicina y GABA",
  [("Bloquea la liberación presináptica de acetilcolina", "Ese es el mecanismo de la toxina botulínica, que causa parálisis flácida."),
   ("Activa la adenilato ciclasa intestinal", "Es el mecanismo de la toxina colérica."),
   ("Inhibe la síntesis proteica vía EF-2", "Corresponde a la toxina diftérica.")],
  "La tetanospasmina viaja por transporte axonal retrógrado y bloquea la liberación de neurotransmisores inhibitorios en la médula; el resultado es la contracción sostenida.",
  {"documento": "Murray. Microbiología médica, 9.ª ed.", "anio": 2021, "url": ""})

q("ESSALUD", "Medicina", "Hematología", "Anemia ferropénica", 2, "directa",
  "Mujer de 32 años con menstruaciones abundantes, fatiga y Hb 9.1 g/dL con VCM 71 fL. ¿Qué otro hallazgo de laboratorio es el esperado?",
  "Ferritina baja y ADE elevado",
  [("Ferritina alta y transferrina baja", "Es el patrón de la anemia de enfermedad crónica."),
   ("Reticulocitos altos y VCM elevado", "Sugiere hemólisis o sangrado agudo con respuesta medular, no déficit de hierro."),
   ("Hierro sérico alto y ferritina alta", "Orienta a sobrecarga de hierro o anemia sideroblástica.")],
  "En la ferropenia la ferritina es baja (el mejor marcador de depósitos), la transferrina alta y el ADE aumentado por la anisocitosis.",
  {"documento": "Harrison. Principios de medicina interna, 21.ª ed.", "anio": 2022, "url": ""})

# ---------------------------------------------------------------- ENAM
q("ENAM", "Medicina", "Respiratorio", "Tromboembolismo pulmonar", 2, "caso_clinico",
  "Mujer de 45 años, a los 10 días de una artroplastia de cadera, presenta disnea súbita y dolor pleurítico. FC 112 por minuto, saturación 90 %, PA 128/80 mmHg. Wells alto. ¿Cuál es el examen indicado?",
  "Angiotomografía de arterias pulmonares",
  [("Dímero D como única prueba diagnóstica", "Con probabilidad clínica alta el dímero D no descarta la enfermedad."),
   ("Radiografía de tórax como prueba definitiva", "Ayuda a descartar otras causas, pero no confirma el diagnóstico."),
   ("Espirometría con prueba broncodilatadora", "No tiene utilidad en la sospecha de tromboembolismo.")],
  "Con probabilidad clínica alta y paciente estable, se pasa directamente a la angiotomografía pulmonar; el dímero D solo sirve para descartar en probabilidad baja o intermedia.",
  {"documento": "ESC Guidelines for the diagnosis and management of acute pulmonary embolism", "anio": 2019, "url": "https://academic.oup.com/eurheartj/article/41/4/543/5556136"})

q("ENAM", "Medicina", "Digestivo", "Hemorragia variceal", 3, "caso_clinico",
  "Varón de 55 años con cirrosis alcohólica presenta hematemesis abundante. FC 118 por minuto, PA 90/60 mmHg. Ya se inició reanimación con cristaloides y octreotide. ¿Qué otra medida reduce la mortalidad en esta fase?",
  "Profilaxis con ceftriaxona endovenosa",
  [("Propranolol endovenoso en bolo", "Los betabloqueantes se usan en profilaxis, no en el sangrado agudo con hipotensión."),
   ("Plasma fresco congelado a todo paciente", "Corregir el INR con plasma no mejora el control del sangrado variceal."),
   ("Omeprazol oral como única terapia", "No controla el sangrado de várices ni reemplaza el manejo endoscópico.")],
  "En el cirrótico con hemorragia digestiva, la profilaxis antibiótica (ceftriaxona) reduce infecciones, resangrado y mortalidad; se suma al vasoactivo y a la ligadura endoscópica.",
  {"documento": "Baveno VII. Renewing consensus in portal hypertension", "anio": 2022, "url": "https://www.journal-of-hepatology.eu/article/S0168-8278(21)02299-6/fulltext"})

q("ENAM", "Medicina", "Endocrino y metabolismo", "Hipotiroidismo primario", 1, "directa",
  "Mujer de 50 años con fatiga, frío, estreñimiento y piel seca. ¿Qué perfil tiroideo confirma un hipotiroidismo primario?",
  "TSH elevada con T4 libre baja",
  [("TSH baja con T4 libre baja", "Sugiere hipotiroidismo central (hipofisario o hipotalámico)."),
   ("TSH baja con T4 libre elevada", "Es el patrón del hipertiroidismo primario."),
   ("TSH elevada con T4 libre normal", "Corresponde al hipotiroidismo subclínico.")],
  "En el hipotiroidismo primario falla la glándula: la T4 libre baja y la hipófisis responde elevando la TSH.",
  {"documento": "ATA. Guidelines for the Treatment of Hypothyroidism", "anio": 2014, "url": "https://www.liebertpub.com/doi/10.1089/thy.2014.0028"})

q("ENAM", "Pediatría", "Neonatología", "Ictericia neonatal", 2, "directa",
  "En un recién nacido a término, ¿qué característica de la ictericia obliga a estudiarla como patológica?",
  "Aparición en las primeras 24 horas de vida",
  [("Aparición al tercer día en un niño sano", "Es el momento típico de la ictericia fisiológica."),
   ("Predominio leve de la bilirrubina indirecta", "La fisiológica también es de predominio indirecto."),
   ("Desaparición antes de cumplir dos semanas", "Es la evolución esperada de la ictericia fisiológica.")],
  "La ictericia en las primeras 24 horas sugiere hemólisis (por ejemplo, incompatibilidad de grupo) y exige medir bilirrubina y estudiar la causa.",
  {"documento": "AAP Clinical Practice Guideline Revision: Management of Hyperbilirubinemia in the Newborn ≥35 Weeks", "anio": 2022, "url": "https://publications.aap.org/pediatrics/article/150/3/e2022058859/188726"})

q("ENAM", "Pediatría", "Emergencias pediátricas", "Laringotraqueítis (crup)", 2, "caso_clinico",
  "Niño de 2 años con tos perruna, disfonía y estridor en reposo desde la madrugada. Tiene tiraje leve, saturación 95 % y está febril. ¿Cuál es el tratamiento?",
  "Dexametasona y adrenalina nebulizada",
  [("Amoxicilina oral por diez días", "El crup es viral; el antibiótico no está indicado."),
   ("Salbutamol inhalado y alta al hogar", "El problema es la obstrucción de la vía aérea alta, no el broncoespasmo."),
   ("Intubación orotraqueal de inmediato", "Se reserva para la falla respiratoria; este niño satura bien.")],
  "En el crup con estridor en reposo se indica corticoide (dexametasona) y adrenalina nebulizada, que reduce el edema subglótico en minutos.",
  {"documento": "Cochrane. Glucocorticoids for croup in children", "anio": 2018, "url": "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD001955.pub4/full"})

q("ENAM", "Pediatría", "Niño y adolescente", "Desnutrición crónica", 1, "directa",
  "Según los patrones de crecimiento de la OMS, ¿qué indicador define desnutrición crónica en un niño menor de 5 años?",
  "Talla para la edad menor de −2 DE",
  [("Peso para la talla menor de −2 DE", "Define desnutrición aguda (emaciación)."),
   ("Peso para la edad menor de −1 DE", "Ese punto de corte no define desnutrición."),
   ("IMC para la edad mayor de +2 DE", "Indica sobrepeso u obesidad.")],
  "La talla baja para la edad refleja un déficit nutricional prolongado: es el indicador de desnutrición crónica.",
  {"documento": "OMS. Patrones de crecimiento infantil", "anio": 2006, "url": "https://www.who.int/tools/child-growth-standards"})

q("ENAM", "Emergencias y cuidados críticos", "Shock", "Anafilaxia", 2, "caso_clinico",
  "Varón de 30 años, minutos después de una picadura de abeja, presenta urticaria generalizada, sibilancias y PA 80/50 mmHg. ¿Cuál es el tratamiento de primera línea?",
  "Adrenalina 0.5 mg IM en el muslo",
  [("Clorfenamina EV como primera línea", "Los antihistamínicos alivian la piel, pero no revierten el choque."),
   ("Hidrocortisona EV en bolo único", "Los corticoides actúan en horas y no son tratamiento inicial."),
   ("Adrenalina 1 mg SC en el brazo", "La vía subcutánea absorbe peor y esa dosis no es la indicada.")],
  "La adrenalina intramuscular (0.01 mg/kg, máximo 0.5 mg en adultos) en la cara anterolateral del muslo es el tratamiento de primera línea; se repite cada 5 a 15 minutos si hace falta.",
  {"documento": "World Allergy Organization. Anaphylaxis guidance", "anio": 2020, "url": "https://www.worldallergyorganizationjournal.org/article/S1939-4551(20)30375-6/fulltext"})

q("ENAM", "Emergencias y cuidados críticos", "Paro cardiorrespiratorio", "Paro cardiaco: ritmo desfibrilable", 1, "caso_clinico",
  "Durante la RCP de un adulto en paro, el monitor muestra fibrilación ventricular. ¿Cuál es la siguiente acción?",
  "Desfibrilar y reanudar la RCP de inmediato",
  [("Administrar amiodarona antes de la descarga", "La amiodarona se da tras la tercera descarga, no antes de la primera."),
   ("Administrar atropina 1 mg endovenosa", "La atropina no forma parte del manejo del paro cardiaco."),
   ("Buscar pulso carotídeo durante 30 segundos", "La pausa para buscar pulso no debe pasar de 10 segundos.")],
  "La fibrilación ventricular es un ritmo desfibrilable: descarga y reinicio inmediato de 2 minutos de compresiones de alta calidad.",
  {"documento": "AHA Guidelines for CPR and Emergency Cardiovascular Care", "anio": 2020, "url": "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines"})

q("ENAM", "Emergencias y cuidados críticos", "Intoxicaciones", "Intoxicación por paracetamol", 1, "caso_clinico",
  "Mujer de 19 años ingirió 30 tabletas de paracetamol de 500 mg hace 4 horas. Está asintomática. ¿Cuál es el antídoto?",
  "N-acetilcisteína",
  [("Flumazenil endovenoso", "Revierte benzodiacepinas."),
   ("Naloxona endovenosa", "Revierte opioides."),
   ("Atropina endovenosa", "Se usa en intoxicación colinérgica.")],
  "La N-acetilcisteína repone glutatión y previene la necrosis hepática; es más eficaz en las primeras 8 horas tras la ingesta.",
  {"documento": "Goldfrank's Toxicologic Emergencies, 11.ª ed.", "anio": 2019, "url": ""})

q("ENAM", "Ginecología y obstetricia", "Obstetricia", "Rotura prematura de membranas pretérmino", 3, "caso_clinico",
  "Gestante de 29 semanas con rotura prematura de membranas de 3 días, sin contracciones, sin fiebre y con cérvix cerrado. Ya recibió corticoides y antibióticos. Si el parto se volviera inminente, ¿qué fármaco ofrece neuroprotección fetal?",
  "Sulfato de magnesio antes del parto",
  [("Progesterona vaginal diaria", "Se usa para prevenir el parto pretérmino en otros contextos, no como neuroprotección."),
   ("Nifedipino como tocólisis prolongada", "La tocólisis prolongada no mejora el pronóstico en la rotura de membranas."),
   ("Amniocentesis seriadas semanales", "No aportan protección neurológica fetal.")],
  "Ante parto inminente antes de las 32 semanas, el sulfato de magnesio reduce el riesgo de parálisis cerebral en el recién nacido.",
  {"documento": "ACOG Practice Bulletin 217. Prelabor Rupture of Membranes", "anio": 2020, "url": "https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2020/03/prelabor-rupture-of-membranes"})

q("ENAM", "Ginecología y obstetricia", "Obstetricia", "Diabetes gestacional", 2, "directa",
  "En una gestante sin diabetes previa, ¿cuándo y con qué prueba se hace el tamizaje de diabetes gestacional?",
  "PTOG de 75 g entre las 24 y 28 semanas",
  [("Glucosa capilar al azar en cada control", "No es una prueba válida de tamizaje."),
   ("Hemoglobina glicada en el tercer trimestre", "No tiene sensibilidad suficiente para diabetes gestacional."),
   ("PTOG de 75 g en la semana 36 o después", "Es tardía para intervenir y mejorar los resultados.")],
  "La prueba de tolerancia oral con 75 g de glucosa entre las semanas 24 y 28 es la estrategia recomendada para el tamizaje y diagnóstico.",
  {"documento": "ADA. Standards of Care in Diabetes, sección 15: Management of Diabetes in Pregnancy", "anio": 2025, "url": "https://diabetesjournals.org/care/issue/48/Supplement_1"})

q("ENAM", "Cirugía", "Cirugía general", "Colecistitis aguda", 2, "caso_clinico",
  "Mujer de 48 años con dolor en hipocondrio derecho de 24 horas, fiebre y Murphy positivo. Ecografía: vesícula con cálculos, pared de 6 mm y líquido perivesicular. Sin disfunción orgánica. ¿Cuál es el tratamiento de elección?",
  "Colecistectomía laparoscópica temprana",
  [("Antibiótico y cirugía en 3 meses", "La cirugía diferida aumenta recurrencias y días de hospital."),
   ("CPRE con esfinterotomía urgente", "Está indicada en colangitis o coledocolitiasis, no en colecistitis aislada."),
   ("Colecistostomía percutánea de urgencia", "Se reserva para pacientes graves que no toleran la cirugía.")],
  "La colecistitis aguda leve a moderada en un paciente apto se trata con colecistectomía laparoscópica temprana, idealmente en la primera semana.",
  {"documento": "Tokyo Guidelines 2018 (TG18): flowchart for the management of acute cholecystitis", "anio": 2018, "url": "https://onlinelibrary.wiley.com/doi/10.1002/jhbp.516"})

q("ENAM", "Salud pública", "Bioestadística y epidemiología", "Pruebas diagnósticas", 1, "directa",
  "¿Qué expresa la sensibilidad de una prueba diagnóstica?",
  "La proporción de enfermos con prueba positiva",
  [("La proporción de sanos con prueba negativa", "Esa es la especificidad."),
   ("La probabilidad de enfermar si la prueba es positiva", "Ese es el valor predictivo positivo."),
   ("La proporción total de resultados correctos", "Esa es la exactitud de la prueba.")],
  "Sensibilidad = verdaderos positivos / total de enfermos. Una prueba muy sensible sirve para descartar la enfermedad cuando sale negativa.",
  {"documento": "Gordis. Epidemiología, 6.ª ed.", "anio": 2019, "url": ""})

q("ENAM", "Ética, investigación y gestión", "Ética", "Derechos del paciente", 2, "caso_clinico",
  "Varón de 40 años, lúcido y adecuadamente informado de los riesgos, rechaza una transfusión que no es de emergencia por motivos personales. ¿Cuál es la conducta correcta?",
  "Respetar su decisión y documentarla",
  [("Transfundir sin su consentimiento", "Vulnera su autonomía y el derecho al consentimiento informado."),
   ("Pedir autorización a un familiar", "Un adulto capaz decide por sí mismo; el familiar no lo reemplaza."),
   ("Darle el alta por negarse al tratamiento", "Debe ofrecerse la mejor alternativa disponible, no abandonarlo.")],
  "Un adulto capaz e informado puede rechazar un tratamiento. Se respeta su decisión, se documenta y se ofrecen alternativas.",
  {"documento": "Ley N.° 29414, que establece los derechos de las personas usuarias de los servicios de salud", "anio": 2009, "url": ""})

q("ENAM", "Ética, investigación y gestión", "Investigación", "Estudios epidemiológicos", 1, "directa",
  "En un estudio de casos y controles, ¿cuál es la medida de asociación adecuada?",
  "Odds ratio (razón de momios)",
  [("Riesgo relativo (razón de riesgos)", "Requiere conocer la incidencia, propia de los estudios de cohorte."),
   ("Tasa de incidencia acumulada", "No se puede calcular porque se parte de los enfermos."),
   ("Prevalencia de periodo", "Es una medida de frecuencia, no de asociación.")],
  "En los casos y controles se parte del efecto y se comparan exposiciones; por eso se calcula el odds ratio.",
  {"documento": "Gordis. Epidemiología, 6.ª ed.", "anio": 2019, "url": ""})

# ---------------------------------------------------------------- SERUMS
q("SERUMS", "Cuidado integral de salud", "Enfermedades metaxénicas", "Malaria por P. vivax", 2, "directa",
  "En el tratamiento de la malaria por Plasmodium vivax se añade primaquina a la cloroquina. ¿Cuál es el objetivo de la primaquina?",
  "Eliminar los hipnozoítos hepáticos",
  [("Reducir la fiebre en las primeras 24 h", "La fiebre cede con el esquema esquizonticida."),
   ("Prevenir la anemia hemolítica del paciente", "La primaquina puede causar hemólisis en déficit de G6PD."),
   ("Potenciar la acción de la cloroquina", "Actúan en fases distintas del ciclo del parásito.")],
  "P. vivax deja formas latentes en el hígado (hipnozoítos) que causan recaídas; la primaquina es la cura radical.",
  {"documento": "OMS. Guidelines for malaria", "anio": 2023, "url": "https://www.who.int/publications/i/item/guidelines-for-malaria"})

q("SERUMS", "Cuidado integral de salud", "Enfermedades metaxénicas", "Dengue con signos de alarma", 2, "caso_clinico",
  "Varón de 25 años en Piura con 4 días de fiebre. Hoy tiene dolor abdominal intenso, vómitos persistentes y hepatomegalia dolorosa. PA 110/70 mmHg. ¿Cuál es la conducta?",
  "Hospitalizar e hidratar por vía EV",
  [("Tratamiento en casa con ibuprofeno", "Los AINE están contraindicados por el riesgo de sangrado."),
   ("Transfusión profiláctica de plaquetas", "No está indicada y no previene el choque."),
   ("Alta con paracetamol y control en 72 h", "Con signos de alarma el riesgo de choque es inminente.")],
  "Dolor abdominal intenso, vómitos persistentes y hepatomegalia son signos de alarma: el paciente se hospitaliza y recibe cristaloides endovenosos con vigilancia estrecha.",
  {"documento": "OPS. Directrices para el diagnóstico clínico y el tratamiento del dengue, el chikunguña y el zika", "anio": 2022, "url": "https://iris.paho.org/handle/10665.2/55125"})

q("SERUMS", "Cuidado integral de salud", "Zoonosis", "Rabia: profilaxis posexposición", 2, "caso_clinico",
  "Niño de 8 años es mordido en la mejilla por un perro callejero que huyó. La herida es profunda. ¿Cuál es la profilaxis indicada?",
  "Lavado, vacuna antirrábica e inmunoglobulina",
  [("Solo lavado de la herida y observación", "Una mordedura profunda en la cara es exposición grave."),
   ("Solo vacuna antirrábica sin inmunoglobulina", "En exposición categoría III se añade inmunoglobulina."),
   ("Antibiótico oral y vacuna antitetánica", "Pueden necesitarse, pero no protegen contra la rabia.")],
  "Mordedura transdérmica en la cabeza por un animal no observable es exposición categoría III: lavado de la herida, vacuna e inmunoglobulina antirrábica.",
  {"documento": "OMS. Rabies vaccines: WHO position paper", "anio": 2018, "url": "https://www.who.int/publications/i/item/who-wer9316"})

q("SERUMS", "Cuidado integral de salud", "Emergencias en el primer nivel", "Mordedura de serpiente", 1, "directa",
  "Un agricultor es mordido por una serpiente en la selva. ¿Cuál de estas medidas está contraindicada?",
  "Aplicar torniquete y hacer incisión",
  [("Inmovilizar el miembro afectado", "Es una medida correcta: reduce la absorción del veneno."),
   ("Retirar anillos y objetos ajustados", "Es correcto: evita la compresión por el edema."),
   ("Trasladar para aplicar suero específico", "Es lo indicado: el antiveneno es el tratamiento.")],
  "El torniquete, la incisión y la succión aumentan el daño local y no reducen el veneno circulante; se inmoviliza y se traslada para el antiveneno.",
  {"documento": "OMS SEARO. Guidelines for the management of snakebites, 2.ª ed.", "anio": 2016, "url": "https://iris.who.int/handle/10665/249547"})

q("SERUMS", "Salud pública", "Epidemiología", "Tasa de ataque", 1, "directa",
  "En un almuerzo comunal comieron 120 personas y 30 enfermaron de diarrea en las siguientes 24 horas. ¿Cuál es la tasa de ataque?",
  "25 %",
  [("30 %", "Confunde el número de enfermos con el porcentaje."),
   ("4 %", "Invierte el cálculo (120 / 30)."),
   ("75 %", "Corresponde a quienes no enfermaron.")],
  "Tasa de ataque = enfermos / expuestos × 100 = 30 / 120 × 100 = 25 %.",
  {"documento": "Gordis. Epidemiología, 6.ª ed.", "anio": 2019, "url": ""})

q("SERUMS", "Cuidado integral de salud", "Atención primaria de salud", "Declaración de Alma-Ata", 1, "directa",
  "¿Qué conferencia internacional definió la atención primaria de salud como estrategia para alcanzar la salud para todos?",
  "Alma-Ata, 1978",
  [("Ottawa, 1986", "Es la carta de promoción de la salud."),
   ("Astaná, 2018", "Renovó el compromiso con la APS 40 años después."),
   ("Ginebra, 1946", "Corresponde a la Constitución de la OMS.")],
  "La Declaración de Alma-Ata (1978) definió la atención primaria de salud y la meta de salud para todos.",
  {"documento": "OMS. Declaración de Alma-Ata", "anio": 1978, "url": "https://www.who.int/publications/i/item/WHO-EURO-1978-3938-43697-61471"})

q("SERUMS", "Salud pública", "Promoción y prevención", "Niveles de prevención", 1, "directa",
  "El tamizaje de cáncer de cuello uterino con inspección visual con ácido acético corresponde a:",
  "Prevención secundaria",
  [("Prevención primaria", "Busca evitar la enfermedad, como la vacuna contra el VPH."),
   ("Prevención terciaria", "Reduce secuelas cuando la enfermedad ya está establecida."),
   ("Promoción de la salud", "Actúa sobre los determinantes, no sobre una enfermedad concreta.")],
  "El tamizaje detecta la enfermedad en fase temprana y asintomática: es prevención secundaria.",
  {"documento": "Leavell y Clark. Niveles de prevención (Historia natural de la enfermedad)", "anio": 1965, "url": ""})

q("SERUMS", "Cuidado integral de salud", "Salud materna", "Atención prenatal", 2, "directa",
  "Según el modelo de atención prenatal de la OMS de 2016, ¿cuántos contactos mínimos debe tener una gestante?",
  "Ocho contactos",
  [("Cuatro contactos", "Es el modelo anterior, reemplazado en 2016."),
   ("Seis contactos", "No es el mínimo que recomienda el modelo de la OMS."),
   ("Doce contactos", "Supera el mínimo recomendado para embarazos sin riesgo.")],
  "La OMS recomienda un mínimo de 8 contactos prenatales, con el primero antes de las 12 semanas.",
  {"documento": "OMS. Recomendaciones sobre atención prenatal para una experiencia positiva del embarazo", "anio": 2016, "url": "https://iris.who.int/handle/10665/250800"})

q("SERUMS", "Cuidado integral de salud", "Tuberculosis", "Contactos de TB", 2, "caso_clinico",
  "Niña de 3 años, contacto domiciliario de su padre con TB pulmonar con baciloscopía positiva. Está asintomática, con examen físico y radiografía normales. ¿Qué corresponde?",
  "Dar terapia preventiva para TB",
  [("Solo observación y control en seis meses", "Los menores de 5 años contactos tienen alto riesgo de enfermar."),
   ("Esquema completo para TB sensible", "No hay enfermedad activa; se indica terapia preventiva."),
   ("Vacuna BCG de refuerzo inmediata", "La BCG no se usa como refuerzo ni previene la infección.")],
  "En contactos menores de 5 años, descartada la enfermedad activa, se indica terapia preventiva sin esperar pruebas de infección.",
  {"documento": "OMS. Consolidated guidelines on tuberculosis, Module 1: Prevention – TB preventive treatment", "anio": 2024, "url": "https://www.who.int/publications/i/item/9789240096196"})

q("SERUMS", "Cuidado integral de salud", "Salud infantil", "Neumonía: respiración rápida", 2, "caso_clinico",
  "Niño de 3 años con tos y fiebre de 2 días. Frecuencia respiratoria de 44 por minuto, sin tiraje ni signos de peligro. Según AIEPI, ¿cómo se clasifica su respiración?",
  "Rápida: el umbral es 40 por minuto",
  [("Normal: el umbral es 50 por minuto", "Ese umbral es para lactantes de 2 a 11 meses."),
   ("Normal: el umbral es 60 por minuto", "Ese umbral es para menores de 2 meses."),
   ("Rápida: el umbral es 30 por minuto", "No es el umbral para niños de 1 a 4 años.")],
  "Respiración rápida según edad: 60 o más en menores de 2 meses, 50 o más de 2 a 11 meses y 40 o más de 1 a 4 años.",
  {"documento": "OMS/UNICEF. Atención Integrada a las Enfermedades Prevalentes de la Infancia (AIEPI)", "anio": 2014, "url": ""})

q("SERUMS", "Cuidado integral de salud", "Salud infantil", "Anemia en niños", 2, "caso_clinico",
  "Niño de 18 meses que vive a nivel del mar tiene una hemoglobina de 10.2 g/dL. Según la OMS, ¿cómo se clasifica?",
  "Anemia leve",
  [("Anemia moderada", "Corresponde a valores de 7.0 a 9.9 g/dL."),
   ("Anemia severa", "Corresponde a valores menores de 7.0 g/dL."),
   ("Sin anemia", "En niños de 6 a 59 meses el punto de corte es 11.0 g/dL.")],
  "En niños de 6 a 59 meses, la anemia leve va de 10.0 a 10.9 g/dL. En zonas de altura se ajusta la hemoglobina antes de clasificar.",
  {"documento": "OMS. Guideline on haemoglobin cutoffs to define anaemia in individuals and populations", "anio": 2024, "url": "https://www.who.int/publications/i/item/9789240088542"})

q("SERUMS", "Salud pública", "Vigilancia epidemiológica", "Parálisis flácida aguda", 1, "directa",
  "Un niño de 6 años presenta debilidad aguda en ambas piernas con reflejos disminuidos. ¿Cómo debe tratarse este caso en la vigilancia epidemiológica?",
  "Notificación inmediata como PFA",
  [("Notificación semanal consolidada", "La parálisis flácida aguda es de notificación inmediata."),
   ("No requiere notificación alguna", "Todo caso en menores de 15 años se notifica."),
   ("Notificar solo si se confirma polio", "Se notifica la sospecha, sin esperar confirmación.")],
  "Todo caso de parálisis flácida aguda en menores de 15 años se notifica de inmediato y se investiga para mantener la vigilancia de poliomielitis.",
  {"documento": "OPS. Vigilancia de la parálisis flácida aguda y erradicación de la poliomielitis", "anio": 2017, "url": ""})

q("SERUMS", "Cuidado integral de salud", "Enfermedades no transmisibles", "Diagnóstico de diabetes", 1, "directa",
  "En un adulto asintomático, ¿qué resultado confirma el diagnóstico de diabetes mellitus?",
  "Dos glucosas en ayunas de 126 mg/dL o más",
  [("Una glucosa en ayunas de 110 mg/dL", "Ese valor corresponde a glucosa alterada en ayunas."),
   ("Una hemoglobina glicada de 5.9 % en dos tomas", "Ese valor corresponde a prediabetes."),
   ("Una glucosa al azar de 160 mg/dL", "Sin síntomas, se requiere 200 o más y confirmación.")],
  "En ausencia de síntomas, el diagnóstico requiere dos resultados alterados: glucosa en ayunas de 126 mg/dL o más, HbA1c de 6.5 % o más, o PTOG de 200 mg/dL o más.",
  {"documento": "ADA. Standards of Care in Diabetes, sección 2: Diagnosis and Classification", "anio": 2025, "url": "https://diabetesjournals.org/care/issue/48/Supplement_1"})

q("SERUMS", "Salud pública", "Promoción de la salud", "Lactancia materna", 1, "directa",
  "¿Hasta qué edad recomienda la OMS la lactancia materna exclusiva?",
  "Hasta los 6 meses de edad",
  [("Hasta los 4 meses de edad", "Es una recomendación antigua, ya superada."),
   ("Hasta los 12 meses de edad", "A partir de los 6 meses se inicia la alimentación complementaria."),
   ("Hasta los 2 meses de edad", "Es muy corta y no coincide con la recomendación.")],
  "La OMS recomienda lactancia materna exclusiva durante los primeros 6 meses y continuarla con alimentación complementaria hasta los 2 años o más.",
  {"documento": "OMS. Estrategia mundial para la alimentación del lactante y del niño pequeño", "anio": 2003, "url": "https://iris.who.int/handle/10665/42695"})

q("SERUMS", "Gestión de servicios de salud", "Referencia y contrarreferencia", "Referencia de emergencia obstétrica", 2, "caso_clinico",
  "En un puesto de salud I-1 llega una gestante de 36 semanas con PA 170/110 mmHg y cefalea intensa. ¿Cuál es la conducta adecuada?",
  "Estabilizar con sulfato de Mg y referir",
  [("Inducir el parto en el puesto de salud", "Un I-1 no tiene capacidad resolutiva para esta emergencia."),
   ("Indicar reposo y control al día siguiente", "La preeclampsia severa puede evolucionar a eclampsia en horas."),
   ("Referir sin iniciar ningún tratamiento", "Se debe estabilizar antes y durante el traslado.")],
  "En un establecimiento de baja capacidad se estabiliza (sulfato de magnesio y antihipertensivo) y se refiere a un establecimiento con capacidad resolutiva, con acompañamiento.",
  {"documento": "MINSA. Guías de práctica clínica para la atención de las emergencias obstétricas según nivel de capacidad resolutiva (RM 695-2006/MINSA)", "anio": 2007, "url": ""})
