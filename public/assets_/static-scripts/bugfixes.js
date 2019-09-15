preventSettingMasonryGalleryAsAbsolute();

/**
 * This Bugfix is needed because masonry js gallery keeps overwriting styles for gallery
 * so with high number of images inside div - it won't scale anymore, It cannot be changed in twig
 * because JS overwrites it and besides i don't want to interfere with original code of that lib.
 */
function preventSettingMasonryGalleryAsAbsolute() {
    document.addEventListener("DOMContentLoaded", function () {
        if (document.querySelector('.lightgallery .my-gallery') != null) {
            document.querySelector('.lightgallery .my-gallery').style = "";
            document.querySelector('#aniimated-thumbnials').style = "";
        }
    });
}
