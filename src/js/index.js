import Search from './models/Search'
import * as searchView from './views/searchView'
import {elements,renderLoader,clearLoader} from './views/base'
import Recipe from './models/Recipe'
import * as recipeView from './views/recipeView'
import List from './models/List'
import * as listView from './views/listView'
import Likes from './models/Likes'
import * as likesView from './views/likes' 

const state = {}

const controllSearch = async () => {
    const query = searchView.getInput()
    if (query) {
        state.search = new Search(query)
        searchView.clearInput()
        searchView.clearResults()
        renderLoader(elements.searchRes)
        try {
        await state.search.getResults()
        clearLoader()
        searchView.renderResults(state.search.result)
        } catch (err) {
            alert(err)
            clearLoader()
        }
    }
}
elements.searchFrom.addEventListener('submit', e => {
    e.preventDefault()
    controllSearch()
} )


elements.seachResPages.addEventListener('click',e => {
    const btn = e.target.closest('.btn-inline')
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto,10)
        searchView.clearResults()
        searchView.renderResults(state.search.result,goToPage)
    }
})

const controlRecipe = async () => {
    // get id form url
    const id = window.location.hash.replace('#','')
    if (id) {
        recipeView.clearRecipe()
        // preapre ui for changes'
        renderLoader(elements.recipe)

        if (state.search) searchView.highlightSelected(id)

        // crate new recipe object
        state.recipe = new Recipe(id)
        // get recipe data
        try {
            await state.recipe.getRecipe()
            state.recipe.parseIngredients()
            // calcualte serving and time
            state.recipe.clacTime()
            state.recipe.calcServings()
            //render recipe
            clearLoader()
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id))
        } catch (err) {
            alert(err)
        }
    }
}

['hashchange','load'].forEach(event => window.addEventListener(event,controlRecipe))

const controlList = () => {
    if (!state.list) state.list = new List()
    state.recipe.ingredients.forEach( el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient)
        listView.renderItem(item)
    }) 
}

// handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid
    // handle delete event
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        state.list.deleteItem(id)
        listView.deleteItem(id)
    } else if ( e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value,10) 
        state.list.updateCount(id,val)
    }
})


//like controller
const controlLike = () => {
    if (!state.likes) state.likes = new Likes
    const currentID = state.recipe.id
    //user has not liked current recipe
    if (!state.likes.isLiked(currentID)) {
        //add liek to data

        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        )
        
        //toggle like button
        likesView.toggleLikeBtn(true)

        //add like to UI list
        likesView.renderLike(newLike)

    //user has liked current recipe
    } else {
        //remove like to data
        state.likes.deleteLike(currentID)
        
        //toggle like button
        likesView.toggleLikeBtn(false)

        //remove like to UI list
        likesView.deleteLike(currentID)
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes())
}

// restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes()
    // restore likes
    state.likes.readStorage()
    // toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes())
    state.likes.likes.forEach( like => {likesView.renderLike(like)})
})

//handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec')
            recipeView.updateServingsIngredients(state.recipe)
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        state.recipe.updateServings('inc')
        recipeView.updateServingsIngredients(state.recipe)
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        controlList()
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLike()
    }
})

