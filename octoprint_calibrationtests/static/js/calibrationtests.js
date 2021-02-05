$('#testSelector').on('change', function () {
    //console.log(this.value)
    Array.from($(".calibration-test")).forEach(element => {
        if (element.id == this.value)
        {
            $('#'+element.id).show();
        }
        else
        {
            $('#'+element.id).hide();
        }
    });
});
