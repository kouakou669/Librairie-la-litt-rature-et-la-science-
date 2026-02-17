// validation.js - Gestion de la validation WhatsApp

// Configuration
const WHATSAPP_NUMBER = "+2250153175058"; // Remplace par le vrai numéro
const VALIDATION_CODES = new Set(); // Stockage temporaire des codes validés

// Données du formulaire en attente
let pendingFormData = null;

// Éléments DOM
const modal = document.getElementById('validationModal');
const btnWhatsApp = document.getElementById('btnWhatsApp');
const closeModalBtn = document.getElementById('closeModal');
const validationForm = document.getElementById('validationForm');
const mainForm = document.getElementById('formFiche');

// Interception de la soumission du formulaire principal
mainForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Récupération des données du formulaire
    const formData = new FormData(mainForm);
    pendingFormData = Object.fromEntries(formData.entries());
    
    // Validation des champs obligatoires
    const examen = pendingFormData.examen;
    const filiere = pendingFormData.filiere;
    
    if ((examen === 'BT' || examen === 'BTS') && !filiere.trim()) {
        showToast('La filière est obligatoire pour BT/BTS', 'error');
        return;
    }
    
    // Ouvrir le modal de validation
    openValidationModal();
});

// Ouvrir le modal
function openValidationModal() {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Fermer le modal
function closeValidationModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Réinitialiser le formulaire de validation
    validationForm.reset();
}

// Bouton fermer
closeModalBtn.addEventListener('click', closeValidationModal);

// Fermer en cliquant en dehors
modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        closeValidationModal();
    }
});

// Bouton WhatsApp
btnWhatsApp.addEventListener('click', function() {
    if (!pendingFormData) {
        showToast('Aucune donnée à envoyer', 'error');
        return;
    }
    
    // Générer le message WhatsApp
    const message = generateWhatsAppMessage(pendingFormData);
    
    // Créer le lien WhatsApp
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
    
    // Ouvrir WhatsApp
    window.open(whatsappURL, '_blank');
    
    // Afficher confirmation
    showToast('Message envoyé sur WhatsApp. Attends le code de validation.', 'info');
});

// Générer le message WhatsApp
function generateWhatsAppMessage(data) {
    const lines = [
        '🎓 *DECO AIDE - DEMANDE D\'INSCRIPTION*',
        '',
        `📋 *Informations du candidat:*`,
        `• Civilité: ${data.civilite}`,
        `• Nom: ${data.nom}`,
        `• Prénom: ${data.prenom}`,
        `• Matricule: ${data.matricule}`,
        '',
        `📚 *Formation:*`,
        `• Examen: ${data.examen}`,
        `• Série: ${data.serie}`,
        data.filiere ? `• Filière: ${data.filiere}` : null,
        `• Ville: ${data.ville}`,
        `• LV1: ${data.lv1}`,
        data.lv2 ? `• LV2: ${data.lv2}` : null,
        '',
        `💰 *Paiement:*`,
        `• Montant: ${parseInt(data.montant).toLocaleString()} FCFA`,
        `• Opération: ${data.operation}`,
        '',
        `📞 *Contact:*`,
        `• Téléphone urgence: ${data.urgence}`,
        '',
        `⏰ Date: ${new Date().toLocaleString('fr-FR')}`,
        '',
        '_Merci de valider le paiement et d\'envoyer le code de validation._'
    ].filter(Boolean); // Enlever les lignes null
    
    return lines.join('\n');
}

// Soumission du formulaire de validation
validationForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const codeValidation = document.getElementById('codeValidation').value.trim();
    const referencePayment = document.getElementById('referencePayment').value.trim();
    
    // Vérifier le code de validation
    if (!isValidCode(codeValidation)) {
        showToast('Code de validation invalide. Vérifie ton code.', 'error');
        return;
    }
    
    // Ajouter les informations de validation aux données
    pendingFormData.codeValidation = codeValidation;
    pendingFormData.referencePayment = referencePayment;
    pendingFormData.dateValidation = new Date().toISOString();
    pendingFormData.statut = 'Validé';
    
    // Sauvegarder l'inscription
    saveValidatedInscription(pendingFormData);
    
    // Fermer le modal
    closeValidationModal();
    
    // Réinitialiser le formulaire principal
    mainForm.reset();
    pendingFormData = null;
    
    // Afficher succès
    showToast('✅ Inscription validée et enregistrée avec succès !', 'success');
    
    // Recharger la liste
    setTimeout(() => {
        if (typeof loadList === 'function') {
            loadList();
        }
    }, 500);
});

// Vérifier la validité du code
function isValidCode(code) {
    // Format attendu: DECO-2026-XXXX
    const codePattern = /^DECO-\d{4}-[A-Z0-9]{4,}$/i;
    
    if (!codePattern.test(code)) {
        return false;
    }
    
    // Vérifier si le code n'a pas déjà été utilisé
    if (VALIDATION_CODES.has(code.toUpperCase())) {
        showToast('Ce code a déjà été utilisé.', 'error');
        return false;
    }
    
    return true;
}

// Sauvegarder l'inscription validée
function saveValidatedInscription(data) {
    try {
        // Récupérer les inscriptions existantes
        let inscriptions = JSON.parse(localStorage.getItem('decoInscriptions') || '[]');
        
        // Ajouter un ID unique
        data.id = Date.now().toString();
        
        // Ajouter à la liste
        inscriptions.push(data);
        
        // Sauvegarder
        localStorage.setItem('decoInscriptions', JSON.stringify(inscriptions));
        
        // Marquer le code comme utilisé
        VALIDATION_CODES.add(data.codeValidation.toUpperCase());
        
        // Mettre à jour l'aperçu
        if (typeof updatePreview === 'function') {
            updatePreview(data);
        }
        
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        showToast('Erreur lors de l\'enregistrement', 'error');
        return false;
    }
}

// Fonction toast (réutilisée depuis app.js)
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Gestionnaire de touches (Escape pour fermer)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeValidationModal();
    }
});

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('Module de validation WhatsApp chargé');
});
                                                                 
