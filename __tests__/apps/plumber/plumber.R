#* @apiTitle Plumber example
#* @apiDescription This is an example Plumber API.

#* @get /hello
#* @serializer unboxedJSON
hello <- function(name = "Plumber") {
  cat(paste0("GET '/hello' with name='", name, "'\n"))
  list(msg = paste("Hello, ", name, "!", sep = ""))
}
