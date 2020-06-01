import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';



// global state of the app
// Search Object
// Current recipe 
// Shoping list 
// Linked recipes
const state = {}; 

//
//SEARCH CONTROLLER
//
const controlSearch = async() => {
    // get the query from the view
    const query = searchView.getInput();

    if(query){
        // add to state
        state.search = new Search(query);

        //prepare UI for the results
        searchView.clearInput();
        searchView.clearPreviusSearch();
        renderLoader(elements.searchRes);

       
        try{
             //search for recipes
            await state.search.getData();
        
            //display results in the UI
            clearLoader();
            searchView.renderResult(state.search.result);
        }catch(error){
            alert(error);
            clearLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e =>{
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e =>{
    const btn = e.target.closest('.btn-inline');
    if(btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearPreviusSearch();
        searchView.renderResult(state.search.result, goToPage);
    }
});


//
//RECIPE CONTROLLER
//
const controlRecipe =async () =>{
    //get id from the url
    const id = window.location.hash.replace('#','');

    if(id){
        //prepare the ui
        recipeView.clearRecipe();
        renderLoader(elements.recipe);    

        //create new recipe obj
        state.recipe = new Recipe(id);

     
        try{
            //get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // calculate time and servings
            state.recipe.calcTime();
            state.recipe.calcServings();
            
            // Render result
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );

        }catch(error){
            console.log(error);
            alert(error);
        }

    }
}

['hashchange', 'load'].forEach(event => window.addEventListener(event,controlRecipe));

//
//LIST CONTROLLER
//
const controlList = () =>{
    // create a new list if there is none yet
    if(!state.list) state.list = new List();

    //add each ingredient
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });

}

//
//LIKE CONTROLLER
//
const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentId = state.recipe.id;

    if(!state.likes.isLiked(currentId)){
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        likesView.toggleLikeBtn(true);

        likesView.renderLike(newLike);   

    } else{
        state.likes.deleteLike(currentId); 
        
        likesView.toggleLikeBtn(false);

        likesView.deleteLike(currentId); 
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//restore liked recipes
window.addEventListener('load', () =>{
    state.likes = new Likes();

    state.likes.readStorage();

    likesView.toggleLikeMenu(state.likes.getNumLikes());

    state.likes.likes.forEach(like => likesView.renderLike(like));
});

//handle delete and update list item 
elements.shopping.addEventListener('click', e=> {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        state.list.deleteItem(id);

        listView.deleteItem(id)
    }else if(e.target.matches('.shopping__count-value')){
        if(e.target.value > 0){
            const val = parseFloat(e.target.value, 10); 
            state.list.updateCount(id, val);
        }
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLike();
    }
});

elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        if(state.recipe.servings>1) state.recipe.updateServings('dec');
        recipeView.updateServingsIngredients(state.recipe);

    }else if(e.target.matches('.btn-increase, .btn-increase *')){
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe); 
        
    }else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        controlList();
        
    }else if(e.target.matches('.recipe__love, .recipe__love *')){
        controlLike();

    }
});

window.l = new List();


