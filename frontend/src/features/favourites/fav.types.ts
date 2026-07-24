// Odpowiedz dodania do ulubionych
export type AddToFavouriteResponse = {
    id : number,
    polubione : true
}

// Odpowiedz usuniecia z ulubionych
export type RemoveFromFavouriteResponse = {
    id : number,
    polubione : false
}


// ID ulubionych produktow
export type FavouritesResponse = number[]
