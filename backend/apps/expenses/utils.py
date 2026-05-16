import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_expense_pdf(expense):
    """
    Génère un flux binaire PDF pour une dépense donnée.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Titre principal
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.hexColor("#1e3a8a"), # Bleu foncé pro
        alignment=1, # Centré
        spaceAfter=20
    )
    
    elements.append(Paragraph("RESTAURANT MANAGEMENT SYSTEM", title_style))
    elements.append(Paragraph(f"FACTURE / REÇU DE DÉPENSE N° {str(expense.id)[:8].upper()}", styles['Heading2']))
    elements.append(Spacer(1, 12))
    
    # Informations générales
    info_data = [
        ["Date :", expense.date.strftime("%d/%m/%Y")],
        ["Catégorie :", expense.get_category_display()],
        ["Statut :", expense.get_status_display()],
    ]
    
    t_info = Table(info_data, colWidths=[4*cm, 10*cm])
    t_info.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_info)
    elements.append(Spacer(1, 20))
    
    # Bloc Donneur / Récepteur
    parties_data = [
        [Paragraph("<b>DONNEUR (Issuer)</b>", styles['Normal']), Paragraph("<b>RÉCEPTEUR (Recipient)</b>", styles['Normal'])],
        [expense.issuer_name or "Non spécifié", expense.recipient_name or "Non spécifié"]
    ]
    
    t_parties = Table(parties_data, colWidths=[7*cm, 7*cm])
    t_parties.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.grey),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(t_parties)
    elements.append(Spacer(1, 20))
    
    # Détail de la dépense
    data = [
        ["DESCRIPTION", "MONTANT"],
        [expense.title, f"{expense.amount:,.2f} FG".replace(',', ' ')]
    ]
    
    t_detail = Table(data, colWidths=[10*cm, 4*cm])
    t_detail.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.hexColor("#f3f4f6")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.black),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(t_detail)
    elements.append(Spacer(1, 30))
    
    # Signature / Rédacteur
    footer_data = [
        [f"Facture rédigée par : {expense.created_by.nom if expense.created_by else 'Système'}"],
        [f"Validée par : {expense.validated_by.nom if expense.validated_by else 'En attente'}"],
    ]
    
    for row in footer_data:
        elements.append(Paragraph(row[0], styles['Italic']))
    
    # Génération effective
    doc.build(elements)
    buffer.seek(0)
    return buffer
