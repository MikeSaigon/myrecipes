import { db, storage } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const app = {
    init() {
        this.recipeGrid = document.getElementById('recipe-grid');
        this.modal = document.getElementById('recipe-modal');
        this.modalBody = document.getElementById('modal-body');
        this.closeModalBtn = document.querySelector('.close-modal');
        this.addRecipeBtn = document.getElementById('add-recipe-btn');
        this.addRecipeModal = document.getElementById('add-recipe-modal');
        this.closeAddModalBtn = document.querySelector('.close-add-modal');
        this.addRecipeForm = document.getElementById('add-recipe-form');

        this.setupEventListeners();
        this.loadRecipes();
    },

    setupEventListeners() {
        // Close Recipe Detail Modal
        this.closeModalBtn.addEventListener('click', () => {
            this.modal.classList.remove('active');
        });

        // Close Add Recipe Modal
        this.closeAddModalBtn.addEventListener('click', () => {
            this.addRecipeModal.classList.remove('active');
        });

        // Open Add Recipe Modal
        this.addRecipeBtn.addEventListener('click', () => {
            this.currentEditId = null; // Clear edit mode
            this.addRecipeForm.reset();
            document.querySelector('.modal-header h2').textContent = 'Add New Recipe';
            document.getElementById('ingredients-container').innerHTML = `
                <div class="ingredient-row">
                    <input type="text" name="ing_amount[]" placeholder="Amount" class="form-input small">
                    <input type="text" name="ing_measure[]" placeholder="Unit" class="form-input small">
                    <input type="text" name="ing_name[]" placeholder="Ingredient Name" class="form-input" required>
                </div>`;
            document.getElementById('instructions-container').innerHTML = `
                <div class="instruction-row">
                    <textarea name="instructions[]" placeholder="Step description..." class="form-input" required></textarea>
                </div>`;
            this.addRecipeModal.classList.add('active');
        });

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.modal.classList.remove('active');
            if (e.target === this.addRecipeModal) this.addRecipeModal.classList.remove('active');
        });

        // Add Ingredient Field
        document.getElementById('add-ingredient-btn').addEventListener('click', () => {
            this.addIngredientField();
        });

        // Add Instruction Field
        document.getElementById('add-instruction-btn').addEventListener('click', () => {
            this.addInstructionField();
        });

        // Handle Form Submission
        this.addRecipeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitRecipe();
        });

        // Delete Recipe
        document.getElementById('delete-recipe-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this recipe? This cannot be undone.')) {
                this.deleteRecipe(this.currentRecipeId);
            }
        });

        // Edit Recipe
        document.getElementById('edit-recipe-btn').addEventListener('click', () => {
            this.openEditModal(this.currentRecipe);
        });
    },

    async loadRecipes() {
        try {
            const q = query(collection(db, "recipes"), orderBy("created_at", "desc"));
            const querySnapshot = await getDocs(q);
            const recipes = [];
            querySnapshot.forEach((doc) => {
                recipes.push({ id: doc.id, ...doc.data() });
            });
            this.renderRecipeGrid(recipes);
        } catch (error) {
            console.error('Error loading recipes:', error);
            // If the error is about missing index, we might need to create one, but for simple queries it should be fine.
            // Or if the collection is empty.
            if (error.code === 'failed-precondition') {
                console.warn("Firestore index might be missing. Check console for link.");
            }
            this.recipeGrid.innerHTML = '<p class="error-msg">Failed to load recipes. Please check your connection.</p>';
        }
    },

    renderRecipeGrid(recipes) {
        this.recipeGrid.innerHTML = '';

        if (recipes.length === 0) {
            this.recipeGrid.innerHTML = '<p class="empty-state">No recipes found. Be the first to add one!</p>';
            return;
        }

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card fade-in';
            card.onclick = () => this.openRecipe(recipe.id);

            card.innerHTML = `
                <div class="card-image">
                    <img src="${recipe.image_path || 'images/default_recipe.png'}" alt="${recipe.title}" onerror="this.src='images/default_recipe.png'">
                    <div class="card-overlay">${recipe.difficulty}</div>
                </div>
                <div class="card-content">
                    <h3>${recipe.title}</h3>
                    <div class="card-meta">
                        <span><i class="far fa-clock"></i> ${recipe.prep_time}</span>
                        <span><i class="fas fa-utensils"></i> ${recipe.servings} servings</span>
                    </div>
                </div>
            `;
            this.recipeGrid.appendChild(card);
        });
    },

    async openRecipe(id) {
        console.log('Opening recipe with ID:', id);
        this.currentRecipeId = id;
        try {
            const docRef = doc(db, "recipes", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const recipe = { id: docSnap.id, ...docSnap.data() };
                this.currentRecipe = recipe;
                console.log('Recipe details loaded:', recipe);
                this.renderRecipeDetail(recipe);
                this.modal.classList.add('active');
            } else {
                console.log("No such document!");
            }
        } catch (error) {
            console.error('Error loading recipe details:', error);
        }
    },

    async deleteRecipe(id) {
        console.log('Attempting to delete recipe with ID:', id);
        if (!id) return;

        try {
            // Delete image if it exists and is not default
            if (this.currentRecipe.image_path && !this.currentRecipe.image_path.includes('default_recipe.png') && this.currentRecipe.image_path.startsWith('http')) {
                try {
                    const imageRef = ref(storage, this.currentRecipe.image_path);
                    await deleteObject(imageRef);
                } catch (imgError) {
                    console.warn("Could not delete image:", imgError);
                }
            }

            await deleteDoc(doc(db, "recipes", id));
            alert('Recipe deleted successfully.');
            this.modal.classList.remove('active');
            this.loadRecipes();
        } catch (error) {
            console.error('Error deleting recipe:', error);
            alert('Failed to delete recipe.');
        }
    },

    renderRecipeDetail(recipe) {
        this.modalBody.innerHTML = `
            <div class="recipe-detail-header">
                <img src="${recipe.image_path || 'images/default_recipe.png'}" alt="${recipe.title}" onerror="this.src='images/default_recipe.png'">
            </div>
            <div class="recipe-detail-content">
                <div class="recipe-title-section">
                    <h2>${recipe.title}</h2>
                    <p>${recipe.description}</p>
                    <div class="recipe-stats">
                        <div class="stat-item">
                            <span class="stat-label">Prep Time</span>
                            <span class="stat-value">${recipe.prep_time}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Cook Time</span>
                            <span class="stat-value">${recipe.cook_time}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Servings</span>
                            <span class="stat-value">${recipe.servings}</span>
                        </div>
                    </div>
                </div>
                
                <div class="recipe-body">
                    <div class="ingredients-list">
                        <h3>Ingredients</h3>
                        <ul>
                            ${recipe.ingredients.map(ing => `
                                <li><i class="fas fa-check"></i> ${ing.amount} ${ing.measurement} ${ing.name}</li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div class="instructions-list">
                        <h3>Instructions</h3>
                        <ol>
                            ${recipe.instructions.map(inst => `
                                <li>${inst.instruction_text}</li>
                            `).join('')}
                        </ol>
                    </div>
                </div>
            </div>
        `;
    },

    addIngredientField() {
        const container = document.getElementById('ingredients-container');
        const div = document.createElement('div');
        div.className = 'ingredient-row';
        div.innerHTML = `
            <input type="text" name="ing_amount[]" placeholder="Amount" class="form-input small">
            <input type="text" name="ing_measure[]" placeholder="Unit" class="form-input small">
            <input type="text" name="ing_name[]" placeholder="Ingredient Name" class="form-input" required>
            <button type="button" class="btn-remove" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(div);
    },

    addInstructionField() {
        const container = document.getElementById('instructions-container');
        const div = document.createElement('div');
        div.className = 'instruction-row';
        div.innerHTML = `
            <textarea name="instructions[]" placeholder="Step description..." class="form-input" required></textarea>
            <button type="button" class="btn-remove" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(div);
    },

    openEditModal(recipe) {
        this.currentEditId = recipe.id;
        this.modal.classList.remove('active');

        document.querySelector('.modal-header h2').textContent = 'Edit Recipe';

        const form = this.addRecipeForm;
        form.title.value = recipe.title;
        form.description.value = recipe.description;
        form.prep_time.value = recipe.prep_time;
        form.cook_time.value = recipe.cook_time;
        form.servings.value = recipe.servings;
        form.difficulty.value = recipe.difficulty;

        const ingContainer = document.getElementById('ingredients-container');
        ingContainer.innerHTML = '';
        recipe.ingredients.forEach(ing => {
            const div = document.createElement('div');
            div.className = 'ingredient-row';
            div.innerHTML = `
                <input type="text" name="ing_amount[]" value="${ing.amount}" placeholder="Amount" class="form-input small">
                <input type="text" name="ing_measure[]" value="${ing.measurement}" placeholder="Unit" class="form-input small">
                <input type="text" name="ing_name[]" value="${ing.name}" placeholder="Ingredient Name" class="form-input" required>
                <button type="button" class="btn-remove" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
            `;
            ingContainer.appendChild(div);
        });

        const instContainer = document.getElementById('instructions-container');
        instContainer.innerHTML = '';
        recipe.instructions.forEach(inst => {
            const div = document.createElement('div');
            div.className = 'instruction-row';
            div.innerHTML = `
                <textarea name="instructions[]" placeholder="Step description..." class="form-input" required>${inst.instruction_text}</textarea>
                <button type="button" class="btn-remove" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
            `;
            instContainer.appendChild(div);
        });

        this.addRecipeModal.classList.add('active');
    },

    async submitRecipe() {
        const form = this.addRecipeForm;
        const formData = new FormData(form);

        // Collect Ingredients
        const ingredients = [];
        const amounts = formData.getAll('ing_amount[]');
        const measures = formData.getAll('ing_measure[]');
        const names = formData.getAll('ing_name[]');

        for (let i = 0; i < names.length; i++) {
            if (names[i].trim()) {
                ingredients.push({
                    amount: amounts[i],
                    measurement: measures[i],
                    name: names[i]
                });
            }
        }

        // Collect Instructions
        const instructions = [];
        const instTexts = formData.getAll('instructions[]');
        instTexts.forEach(text => {
            if (text.trim()) {
                instructions.push({ instruction_text: text });
            }
        });

        const recipeData = {
            title: formData.get('title'),
            description: formData.get('description'),
            prep_time: formData.get('prep_time'),
            cook_time: formData.get('cook_time'),
            servings: formData.get('servings'),
            difficulty: formData.get('difficulty'),
            ingredients: ingredients,
            instructions: instructions,
            updated_at: new Date().toISOString()
        };

        if (!this.currentEditId) {
            recipeData.created_at = new Date().toISOString();
        }

        try {
            // Handle Image Upload
            const imageFile = formData.get('image');
            if (imageFile && imageFile.size > 0) {
                const storageRef = ref(storage, 'recipes/' + Date.now() + '_' + imageFile.name);
                await uploadBytes(storageRef, imageFile);
                const downloadURL = await getDownloadURL(storageRef);
                recipeData.image_path = downloadURL;
            } else if (!this.currentEditId) {
                // Default image if new recipe and no image uploaded
                // We can keep it empty or set a placeholder. The render function handles empty.
            }

            if (this.currentEditId) {
                // Update existing
                const recipeRef = doc(db, "recipes", this.currentEditId);
                await updateDoc(recipeRef, recipeData);
                alert('Recipe updated successfully!');
            } else {
                // Add new
                await addDoc(collection(db, "recipes"), recipeData);
                alert('Recipe added successfully!');
            }

            this.addRecipeModal.classList.remove('active');
            this.addRecipeForm.reset();
            this.loadRecipes();
            this.currentEditId = null;

        } catch (error) {
            console.error('Error saving recipe:', error);
            alert('Failed to save recipe: ' + error.message);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
