export type AddToFavouriteResponse = {
    id : number,
    polubione : true
}

export type RemoveFromFavouriteResponse = {
    id : number,
    polubione : false
}


export type FavouritesResponse = number[]
