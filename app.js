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
            const response = await fetch('api/get_recipes.php');
            const recipes = await response.json();
            this.renderRecipeGrid(recipes);
        } catch (error) {
            console.error('Error loading recipes:', error);
            this.recipeGrid.innerHTML = '<p class="error-msg">Failed to load recipes. Please try again later.</p>';
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
                    <img src="${recipe.image_path}" alt="${recipe.title}" onerror="this.src='images/default_recipe.png'">
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
        this.currentRecipeId = id; // Store ID for deletion
        try {
            const response = await fetch(`api/get_recipe_details.php?id=${id}`);
            const recipe = await response.json();
            this.currentRecipe = recipe; // Store full recipe for editing
            console.log('Recipe details loaded:', recipe);
            this.renderRecipeDetail(recipe);
            this.modal.classList.add('active');
        } catch (error) {
            console.error('Error loading recipe details:', error);
        }
    },

    async deleteRecipe(id) {
        console.log('Attempting to delete recipe with ID:', id);
        if (!id) {
            console.error('No recipe ID provided for deletion');
            alert('Error: No recipe selected to delete.');
            return;
        }

        try {
            const response = await fetch('api/delete_recipe.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: id })
            });

            const result = await response.json();
            console.log('Delete response:', result);

            if (result.success) {
                alert('Recipe deleted successfully.');
                this.modal.classList.remove('active');
                this.loadRecipes();
            } else {
                alert('Error deleting recipe: ' + result.error);
            }
        } catch (error) {
            console.error('Error deleting recipe:', error);
            alert('Failed to delete recipe.');
        }
    },

    renderRecipeDetail(recipe) {
        this.modalBody.innerHTML = `
            <div class="recipe-detail-header">
                <img src="${recipe.image_path}" alt="${recipe.title}" onerror="this.src='images/default_recipe.png'">
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
        this.modal.classList.remove('active'); // Close detail modal

        // Update Modal Title
        document.querySelector('.modal-header h2').textContent = 'Edit Recipe';

        // Populate Form Fields
        const form = this.addRecipeForm;
        form.title.value = recipe.title;
        form.description.value = recipe.description;
        form.prep_time.value = recipe.prep_time;
        form.cook_time.value = recipe.cook_time;
        form.servings.value = recipe.servings;
        form.difficulty.value = recipe.difficulty;

        // Populate Ingredients
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

        // Populate Instructions
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
        const formData = new FormData(this.addRecipeForm);
        const url = this.currentEditId ? 'api/update_recipe.php' : 'api/add_recipe.php';

        if (this.currentEditId) {
            formData.append('id', this.currentEditId);
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                alert(this.currentEditId ? 'Recipe updated successfully!' : 'Recipe added successfully!');
                this.addRecipeModal.classList.remove('active');
                this.addRecipeForm.reset();
                this.loadRecipes();
                this.currentEditId = null;
            } else {
                alert('Error saving recipe: ' + result.error);
            }
        } catch (error) {
            console.error('Error submitting recipe:', error);
            alert('Failed to submit recipe.');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
