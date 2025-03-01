var bootbox = require('bootbox');

export default (function () {
    window.ui = {};
    ui.crud = {
        elements: {
            'removed-element-class': '.trash-parent',
            'edited-element-class': '.editable-parent',
            'saved-element-class': '.save-parent',
        },
        classes: {
            'hidden': 'd-none',
            'disabled': 'disabled',
            'table-active': 'table-active',
            'fontawesome-picker-preview': 'fontawesome-preview',
            'fontawesome-picker-input': 'fontawesome-input',
            'fontawesome-picker': 'fontawesome-picker'
        },
        messages: {
            entityUpdateSuccess: function (entity_name) {
                return entity_name + " record has been succesfully updated";
            },
            entityUpdateFail: function (entity_name) {
                return "Something went wrong while updating " + entity_name + " record";
            },
            entityRemoveSuccess: function (entity_name) {
                return entity_name + " record was succesfully removed";
            },
            entityRemoveFail: function (entity_name) {
                return "Something went wrong while removing " + entity_name + " record";
            },
            entityEditStart: function (entity_name) {
                return 'You are currently editing ' + entity_name + ' record'
            },
            entityEditEnd: function (entity_name) {
                return "You've finished editing " + entity_name + ' record';
            },
            entityCreatedRecordSuccess: function (entity_name) {
                return "New " + entity_name + ' record has been created';
            },
            entityCreatedRecordFail: function (entity_name) {
                return "There was a problem while creating " + entity_name + ' record';
            },
            formTargetActionUpdateSuccess:function(form_target_action_name){
                return "Update action for " + form_target_action_name + ' has been completed';
            },
            formTargetActionUpdateFail:function(form_target_action_name){
                return "There was a problem while performing update action for " + form_target_action_name;
            },
            default_record_removal_confirmation_message: 'Are You sure that You want to remove this record?',
            default_copy_data_confirmation_message: 'Data was copied successfully',
            default_copy_data_fail_message: 'There was some problem while copying the data',
            password_copy_confirmation_message: 'Password was copied successfully',
        },
        init: function () {
            this.attachRemovingEventOnTrashIcon();
            this.attachContentEditEventOnEditIcon();
            this.attachContentSaveEventOnSaveIcon();
            this.attachContentCopyEventOnCopyIcon();
            this.attachFontawesomePickEventOnEmojiIcon();
            this.attachRecordAddViaAjaxOnSubmit();
            this.attachRecordUpdateOrAddViaAjaxOnSubmitForSingleForm();
        },
        attachRemovingEventOnTrashIcon: function () {
            let _this = this;
            $('.fa-trash').click(function () {
                let parent_wrapper = $(this).closest(_this.elements["removed-element-class"]);
                let param_entity_name = $(parent_wrapper).attr('data-type');
                let remove_data = _this.entity_actions[param_entity_name].makeRemoveData(parent_wrapper);

                let removal_message = (
                    remove_data.confirm_message !== undefined
                        ? remove_data.confirm_message
                        : _this.messages.default_record_removal_confirmation_message
                );

                bootbox.confirm({
                    message: removal_message,
                    backdrop: true,
                    callback: function (result) {
                        if (result) {
                            $.ajax({
                                url: remove_data.url,
                                method: 'POST',
                                data: remove_data.data,
                                success: (template) => {
                                    bootstrap_notifications.notify(remove_data.success_message, 'success');
                                    let table_id = $(parent_wrapper).closest('tbody').closest('table').attr('id');
                                    if (remove_data['is_dataTable']) {
                                        _this.removeDataTableTableRow(table_id, parent_wrapper);
                                        return;
                                    }
                                    _this.removeTableRow(parent_wrapper);

                                    $('.twig-body-section').html(template);
                                    initializer.reinitialize();
                                },
                            }).fail(() => {
                                bootstrap_notifications.notify(remove_data.fail_message, 'danger')
                            });
                        }
                    }
                });

            });
        },
        attachContentEditEventOnEditIcon: function () {
            let _this = this;
            $('.fa-edit').click(function () {
                let closest_parent = this.closest(_this.elements["edited-element-class"]);
                _this.toggleContentEditable(closest_parent);
            });
        },
        attachContentCopyEventOnCopyIcon: function () {
            let allCopyButtons = $('.fa-copy');
            let _this = this;

            if ($(allCopyButtons).length > 0) {
                $(allCopyButtons).each((index, button) => {

                    $(button).on('click', (event) => {
                        let clickedElement = $(event.target);
                        let parent_wrapper = $(clickedElement).closest(_this.elements["removed-element-class"]);
                        let param_entity_name = $(parent_wrapper).attr('data-type');
                        let copy_data = _this.entity_actions[param_entity_name].makeCopyData(parent_wrapper);

                        let temporaryCopyDataInput = $("<input>");
                        $("body").append(temporaryCopyDataInput);
                        /* Or use this to get directly content by html attributes
                            let selectorOfTargetElement = $(clickedElement).attr('data-copy-from-selector');
                            let targetElement = $(selectorOfTargetElement);
                         */

                        $.ajax({
                            url: copy_data.url,
                            method: 'GET',
                            success: (data) => {
                                temporaryCopyDataInput.val(data).select();
                                document.execCommand("copy");
                                temporaryCopyDataInput.remove();

                                bootstrap_notifications.notify(copy_data.success_message, 'success')
                            },
                        }).fail(() => {
                            bootstrap_notifications.notify(update_data.fail_message, 'danger')
                        });

                    })

                });
            }

        },
        attachContentSaveEventOnSaveIcon: function () {
            let _this = this;
            $('.fa-save').click(function () {
                let closest_parent = this.closest(_this.elements["saved-element-class"]);
                _this.ajaxUpdateDatabaseRecord(closest_parent);
            });
        },
        attachFontawesomePickEventOnEmojiIcon: function () {
            let _this = this;

            $('.' + this.classes["fontawesome-picker-input"]).each((index, input) => {
                $(input).removeClass(this.classes["fontawesome-picker-input"]);
                $(input).addClass(this.classes["fontawesome-picker-input"] + index);
            });

            $('.fa-smile').each((index, icon) => {

                if ($('.' + _this.classes["fontawesome-picker-preview"]).length === 0) {
                    let fontawesome_preview_div = $('<div></div>');
                    $(fontawesome_preview_div).addClass(_this.classes["fontawesome-picker-preview"]).addClass(_this.classes.hidden);
                    $('body').append(fontawesome_preview_div);
                }

                $(icon).addClass('fontawesome-picker' + index);
                $(icon).attr('data-iconpicker-preview', '.' + _this.classes["fontawesome-picker-preview"]);
                $(icon).attr('data-iconpicker-input', '.' + _this.classes["fontawesome-picker-input"] + index);

                IconPicker.Init({
                    jsonUrl: '/assets_/static-libs/furcan-iconpicker/iconpicker-1.0.0.json',
                    searchPlaceholder: 'Search Icon',
                    showAllButton: 'Show All',
                    cancelButton: 'Cancel',
                });
                IconPicker.Run('.' + _this.classes["fontawesome-picker"] + index);
            })
        },
        attachRecordAddViaAjaxOnSubmit: function (reloadPage = true) {
            let _this = this;
            $('.add-record-form form').submit(function (event) {
                let form = $(event.target);
                let entity_name = form.attr('data-entity');
                let method = form.attr('method');

                let create_data = _this.entity_actions[entity_name].makeCreateData();

                $.ajax({
                    url: create_data.url,
                    type: method,
                    data: form.serialize(),
                }).done((template) => {

                    /**
                     * This reloadPage must stay like that,
                     * Somewhere in code I call this function but i pass it as string so it's not getting dettected
                     */
                    bootstrap_notifications.notify(create_data.success_message, 'success');
                    if (!reloadPage) {
                        return;
                    }

                    if (create_data.callback_before) {
                        create_data.callback();
                    }

                    $('.twig-body-section').html(template);
                    initializer.reinitialize();

                }).fail((data) => {
                    bootstrap_notifications.notify(data.responseText, 'danger');
                });

                event.preventDefault();
            });
        },
        attachRecordUpdateOrAddViaAjaxOnSubmitForSingleForm: function () {
            let _this = this;
            $('.update-record-form form').submit(function (event) {
                let form = $(event.target);
                let formTarget = form.attr('data-form-target');
                let updateData = _this.form_target_actions[formTarget].makeUpdateData(form);

                $.ajax({
                    url: updateData.url,
                    type: 'POST',
                    data: updateData.data, //In this case the data from target_action is being sent not form directly
                }).done((data) => {

                    if( undefined !== data['template'] ){
                        $('.twig-body-section').html(data['template']);
                        initializer.reinitialize();
                    }

                    if( undefined !== data['message'] ){
                        bootstrap_notifications.notify(data['message'], 'success');
                    }

                }).fail((data) => {
                    bootstrap_notifications.notify(data.responseText, 'danger');
                });

                event.preventDefault();
            });
        },
        toggleContentEditable: function (tr_closest_parent) {
            let is_content_editable = this.isContentEditable(tr_closest_parent);
            let param_entity_name = $(tr_closest_parent).attr('data-type');

            if (!is_content_editable) {
                $(tr_closest_parent).attr({"contentEditable": "true"});
                $(tr_closest_parent).addClass(this.classes["table-active"]);
                this.toggleActionIconsVisibillity(tr_closest_parent, null, is_content_editable);
                this.toggleDisabledClassForTableRow(tr_closest_parent);

                bootstrap_notifications.notify(this.messages.entityEditStart(this.entity_actions[param_entity_name].entity_name), 'warning');
                return;
            }

            this.toggleActionIconsVisibillity(tr_closest_parent, null, is_content_editable);
            this.toggleDisabledClassForTableRow(tr_closest_parent);

            $(tr_closest_parent).attr({"contentEditable": "false"});
            $(tr_closest_parent).removeClass(this.classes["table-active"]);
            bootstrap_notifications.notify(this.messages.entityEditEnd(this.entity_actions[param_entity_name].entity_name), 'success');
        },
        toggleActionIconsVisibillity: function (tr_parent_element, toggle_content_editable = null, is_content_editable) {
            let save_icon = $(tr_parent_element).find('.fa-save');
            let fontawesome_icon = $(tr_parent_element).find('.action-fontawesome');

            let action_icons = [save_icon, fontawesome_icon];

            $(action_icons).each((index, icon) => {
                if ($(icon).length !== 0 && $(icon).hasClass(this.classes["hidden"]) && !is_content_editable) {
                    $(icon).removeClass(this.classes["hidden"]);
                    return;
                }

                $(icon).addClass(this.classes["hidden"]);
            });

            if (toggle_content_editable === true) {
                this.toggleContentEditable(tr_parent_element);
            }
        },
        toggleDisabledClassForTableRow: function (tr_parent_element) {
            let color_pickers   = $(tr_parent_element).find('.color-picker');
            let option_pickers  = $(tr_parent_element).find('.option-picker');
            let checkbox        = $(tr_parent_element).find('.checkbox-disabled');
            let elements_to_toggle = [color_pickers, option_pickers, checkbox];
            let _this = this;

            $(elements_to_toggle).each((index, element_type) => {

                if ($(element_type).length !== 0) {
                    $(element_type).each((index, element) => {

                        if ($(element).hasClass(_this.classes.disabled)) {
                            $(element).removeClass(_this.classes.disabled);
                        } else {
                            $(element).addClass(_this.classes.disabled);
                        }

                    });
                }

            })

        },
        isContentEditable: function (tr_parent_element) {
            return (typeof $(tr_parent_element).attr("contentEditable") == 'undefined' || $(tr_parent_element).attr("contentEditable") != "true" ? false : true);
        },
        ajaxUpdateDatabaseRecord: function (tr_parent_element) {
            let param_entity_name = $(tr_parent_element).attr('data-type');
            let update_data = this.entity_actions[param_entity_name].makeUpdateData(tr_parent_element);
            let _this = this;

            if (update_data.edit !== undefined && update_data.edit !== null && update_data.edit.invokeAlert === true) {

                bootbox.confirm({
                    message: update_data.edit.alertMessage,
                    backdrop: true,
                    callback: function (result) {
                        if (result) {
                            _this.makeAjaxRecordUpdateCall(update_data);
                            _this.toggleActionIconsVisibillity(tr_parent_element, true);
                        }
                    }
                });

            } else {
                _this.makeAjaxRecordUpdateCall(update_data);
            }

        },
        makeAjaxRecordUpdateCall: function (update_data) {
            $.ajax({
                url: update_data.url,
                method: 'POST',
                data: update_data.data,
                success: (template) => {
                    bootstrap_notifications.notify(update_data.success_message, 'success');

                    if( true === update_data.update_template ){
                        $('.twig-body-section').html(template);
                        initializer.reinitialize();
                    }

                },
            }).fail(() => {
                bootstrap_notifications.notify(update_data.fail_message, 'danger')
            });
        },
        removeDataTableTableRow: function (table_id, tr_parent_element) {
            datatable.destroy(table_id);
            tr_parent_element.remove();
            datatable.reinit(table_id)
        },
        removeTableRow: function (tr_parent_element) {
            tr_parent_element.remove();

        },
        entity_actions: {
            "MyCar": {
                makeUpdateData: function (tr_parent_element) {
                    let id              = $(tr_parent_element).find('.id').html();
                    let name            = $(tr_parent_element).find('.name').html();
                    let scheduleType    = $(tr_parent_element).find('.type :selected');
                    let date            = $(tr_parent_element).find('.date').html();
                    let information     = $(tr_parent_element).find('.information').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-car/update/';
                    let ajax_data = {
                        'name': name,
                        'date': date,
                        'information': information,
                        'id': id,
                        'scheduleType': {
                            "type": "entity",
                            'namespace': 'App\\Entity\\Modules\\Car\\MyCarSchedulesTypes',
                            'id': $(scheduleType).val(),
                        },
                    };

                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.id').html();
                    let url = '/my-car/remove/';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': true,
                    };

                },
                makeCreateData: function () {
                    let url = '/my-car';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Car",
            },
            "MyCarSchedulesTypes": {
                makeUpdateData: function (tr_parent_element) {
                    let id   = $(tr_parent_element).find('.id').html();
                    let name = $(tr_parent_element).find('.name').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message    = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-car-settings/schedule-type/update';
                    let ajax_data = {
                        'name': name,
                        'id'  : id
                    };

                    return {
                        'url'               : url,
                        'data'              : ajax_data,
                        'success_message'   : success_message,
                        'fail_message'      : fail_message
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id              = $(parent_element).find('.id').html();
                    let name            = $(parent_element).find('.name').html();
                    let url             = '/my-car-settings/schedule-type/remove';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message    = ui.crud.messages.entityRemoveFail(this.entity_name);

                    let message = 'You are about to remove schedule type named <b>' + name + ' </b>. There might be schedule connected with it. Are You 100% sure? This might break something...';
                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                        'confirm_message': message
                    };
                },
                makeCreateData: function () {
                    let url = '/my-car-settings';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Car Schedule Type",
            },
            "IntegrationResource": {
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.db-id').html();
                    let name = $(tr_parent_element).find('.resource-name').html();
                    let data = $(tr_parent_element).find('.resource-data').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/integrations-resource/update/';
                    let ajax_data = {
                        'id': id,
                        'name': name,
                        'data': data,
                    };

                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.db-id').html();
                    let url = '/integrations-resource/remove/';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false,
                    };

                },
                makeCreateData: function () {
                    let url = '/integrations';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "Integration Resource",
            },
            "MyPaymentsProduct": {
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.id').html();
                    let name = $(tr_parent_element).find('.name').html();
                    let price = $(tr_parent_element).find('.price').html();
                    let market = $(tr_parent_element).find('.market').html();
                    let products = $(tr_parent_element).find('.products').html();
                    let information = $(tr_parent_element).find('.information').html();
                    let rejected = $(tr_parent_element).find('.rejected').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-payments-products/update/';
                    let ajax_data = {
                        'id': id,
                        'name': name,
                        'price': price,
                        'market': market,
                        'products': products,
                        'information': information,
                        'rejected': rejected
                    };
                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.id').html();
                    let url = '/my-payments-products/remove/';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': true,
                    };

                },
                makeCreateData: function () {
                    let url = '/my-payments-products';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Payments Product",
            },
            "MyPaymentsMonthly": {
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.id').html();
                    let date = $(tr_parent_element).find('.date').html();
                    let money = $(tr_parent_element).find('.money').html();
                    let description = $(tr_parent_element).find('.description').html();
                    let paymentType = $(tr_parent_element).find('.type :selected');

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-payments-monthly/update/';
                    let ajax_data = {
                        'id': id,
                        'date': date,
                        'money': money,
                        'description': description,
                        'type': {
                            "type": "entity",
                            'namespace': 'App\\Entity\\Modules\\Payments\\MyPaymentsSettings',
                            'id': $(paymentType).val(),
                        },
                    };

                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.id').html();
                    let url = '/my-payments-monthly/remove/';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                    };

                },
                makeCreateData: function () {
                    let url = '/my-payments-monthly';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Payments Monthly",
            },
            "MyPaymentsOwed": {
                makeUpdateData: function (tr_parent_element) {
                    let id          = $(tr_parent_element).find('.id').html();
                    let date        = $(tr_parent_element).find('.date').html();
                    let target      = $(tr_parent_element).find('.target').html();
                    let amount      = $(tr_parent_element).find('.amount').html();
                    let information = $(tr_parent_element).find('.information').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-payments-owed/update/';
                    let ajax_data = {
                        'id'         : id,
                        'date'       : date,
                        'target'     : target,
                        'amount'     : amount,
                        'information': information,
                    };

                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id              = $(parent_element).find('.id').html();
                    let url             = '/my-payments-owed/remove/';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message    = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message'   : fail_message,
                        'is_dataTable'   : false, //temporary
                    };

                },
                makeCreateData: function () {
                    let url             = '/my-payments-owed';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message    = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url'            : url,
                        'success_message': success_message,
                        'fail_message'   : fail_message,
                    };
                },
                entity_name: "My Payments Owed",
            },
            "MyJobAfterhours": {
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.id').html();
                    let date = $(tr_parent_element).find('.date').html();
                    let minutes = $(tr_parent_element).find('.minutes').html();
                    let description = $(tr_parent_element).find('.description').html();
                    let type = $(tr_parent_element).find('.type').html();
                    let goal = $(tr_parent_element).find('.goal').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-job/afterhours/update/';
                    let ajax_data = {
                        'date': date,
                        'description': description,
                        'minutes': minutes,
                        'type': type,
                        'id': id,
                        'goal': goal,
                    };
                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.id').html();
                    let url = '/my-job/afterhours/remove/';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                    };

                },
                makeCreateData: function () {
                    let url = '/my-job/afterhours';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Job Afterhours",
            },
            "MyJobHolidays": {
                makeUpdateData: function (tr_parent_element) {
                    let id          = $(tr_parent_element).find('.id').html();
                    let year        = $(tr_parent_element).find('.year').html();
                    let daysSpent   = $(tr_parent_element).find('.daysSpent').html();
                    let information = $(tr_parent_element).find('.information').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message    = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-job/holidays/update/';
                    let ajax_data = {
                        'year'          : year,
                        'daysSpent'     : daysSpent,
                        'information'   : information,
                        'id'            : id,
                    };
                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id              = $(parent_element).find('.id').html();
                    let url             = '/my-job/holidays/remove/';
                    let fail_message    = ui.crud.messages.entityRemoveFail(this.entity_name);
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                    };

                },
                makeCreateData: function () {
                    let url             = '/my-job/holidays';
                    let fail_message    = ui.crud.messages.entityCreatedRecordFail(this.entity_name);
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Job Holidays",
            },
            "MyJobHolidaysPool": {
                makeUpdateData: function (tr_parent_element) {
                    let id          = $(tr_parent_element).find('.id').html();
                    let year        = $(tr_parent_element).find('.year').html();
                    let daysLeft    = $(tr_parent_element).find('.daysLeft').html();
                    let companyName = $(tr_parent_element).find('.companyName').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message    = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-job/holidays-pool/update/';
                    let ajax_data = {
                        'year'          : year,
                        'daysLeft'      : daysLeft,
                        'companyName'   : companyName,
                        'id'            : id,
                    };
                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id              = $(parent_element).find('.id').html();
                    let url             = '/my-job/holidays-pool/remove/';
                    let fail_message    = ui.crud.messages.entityRemoveFail(this.entity_name);
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                    };

                },
                makeCreateData: function () {
                    let url             = '/my-job/settings';
                    let fail_message    = ui.crud.messages.entityCreatedRecordFail(this.entity_name);
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Job Holidays Pool",
            },
            "MyShoppingPlans": {
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.id').html();
                    let information = $(tr_parent_element).find('.information').html();
                    let example = $(tr_parent_element).find('.example').html();
                    let name = $(tr_parent_element).find('.name').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-shopping/plans/update/';
                    let ajax_data = {
                        'id': id,
                        'information': information,
                        'example': example,
                        'name': name
                    };

                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.id').html();
                    let url = '/my-shopping/plans/remove/';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                    };

                },
                makeCreateData: function () {
                    let url = '/my-shopping/plans';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Shopping Plans",
            },
            "MyTravelsIdeas": {
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.id').html();
                    let location = $(tr_parent_element).find('.location span').html();
                    let country = $(tr_parent_element).find('.country span').html();
                    let image = $(tr_parent_element).find('.image img').attr('src');
                    let map = $(tr_parent_element).find('.map a').attr('href');
                    let category = $(tr_parent_element).find('.category i').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-travels/ideas/update/';
                    let ajax_data = {
                        'location': location,
                        'country': country,
                        'image': image,
                        'map': map,
                        'category': category,
                        'id': id
                    };

                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.id').html();
                    let url = '/my-travels/ideas/remove/';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                    };

                },
                makeCreateData: function () {
                    let url = '/my/travels/ideas';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Travels Ideas",
            },
            "Achievements": {
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.id').html();
                    let type = $(tr_parent_element).find('.type').html();
                    let description = $(tr_parent_element).find('.description').html();
                    let name = $(tr_parent_element).find('.name').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/achievement/update/';
                    let ajax_data = {
                        'id': id,
                        'name': name,
                        'description': description,
                        'type': type
                    };

                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.id').html();
                    let url = '/achievement/remove/';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                    };

                },
                makeCreateData: function () {
                    let url = '/achievement';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "Achievements",
            },
            "MyNotesCategories": {
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.id').html();
                    let name = $(tr_parent_element).find('.name').html();
                    let icon = $(tr_parent_element).find('.icon').html();
                    let color = $(tr_parent_element).find('.color').text();
                    let parent = $(tr_parent_element).find('.parent').find(':selected').val();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-notes/settings/update/';
                    let ajax_data = {
                        'name': name,
                        'icon': icon,
                        'color': color,
                        'parent_id': parent,
                        'id': id
                    };

                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.id').html();
                    let url = '/my-notes/settings/remove/';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                        'confirm_message': 'This category might contain notes or be parent of other category. Do You really want to remove it?'
                    };

                },
                makeCreateData: function () {
                    let url = '/my-notes/settings';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Notes Categories",
            },
            "MyNotes": {
                makeCreateData: function () {
                    let url = '/my-notes/create';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'callback': function () {
                            tinymce.remove(".tiny-mce"); //tinymce must be removed or won't be reinitialized.
                        },
                        'callback_before': true,
                    };
                },
                entity_name: "My Notes",
            },
            "MyPaymentsSettings": {
                /**
                 * @info Important! At this moment settings panel has only option to add currency and types
                 * while currency will be rarely changed if changed at all, I've prepared this to work only with types
                 */
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.id').html();
                    let value = $(tr_parent_element).find('.value').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-payments-settings/update';
                    let ajax_data = {
                        'value': value,
                        'id': id
                    };

                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.id').html();
                    let url = '/my-payments-settings/remove/';
                    let value = $(parent_element).find('.value').html();
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);
                    let message = 'You are about to remove type named <b>' + value + ' </b>. There might be payment connected with it. Are You 100% sure? This might break something...';

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                        'confirm_message': message
                    };

                },
                makeCreateData: function () {
                    let url = '/my-payments-settings';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Payments Settings",
            },
            "MyContacts": {
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.id').html();
                    let contact = $(tr_parent_element).find('.contact').html();
                    let description = $(tr_parent_element).find('.description').html();
                    let type = $(tr_parent_element).find('.type').html();
                    let groupId = $(tr_parent_element).find('.group :selected').val();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-contacts/update/' + type.trim();
                    let ajax_data = {
                        'contact': contact,
                        'description': description,
                        'id': id,
                        'group': {
                            "type": "entity",
                            'namespace': 'App\\Entity\\Modules\\Contacts\\MyContactsGroups',
                            'id': groupId,
                        },
                    };

                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message
                    }
                },
                makeRemoveData: function (parent_element, type = '') {
                    let id = $(parent_element).find('.id').html();
                    let url = '/my-contacts/remove/' + type;
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                    };

                },
                makeCreateData: function (type = '') {
                    let url = '/my-contacts' + type;
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Contacts",
            },
            "MyContactsPhone": {
                makeUpdateData: function (tr_parent_element) {
                    return ui.crud.entity_actions.MyContacts.makeUpdateData(tr_parent_element);
                },
                makeRemoveData: function (parent_element) {
                    return ui.crud.entity_actions.MyContacts.makeRemoveData(parent_element, 'phone');
                },
                makeCreateData: function () {
                    return ui.crud.entity_actions.MyContacts.makeCreateData('/phone');
                },
                entity_name: "My Contacts",
            },
            "MyContactsEmail": {
                makeUpdateData: function (tr_parent_element) {
                    return ui.crud.entity_actions.MyContacts.makeUpdateData(tr_parent_element);
                },
                makeRemoveData: function (parent_element) {
                    return ui.crud.entity_actions.MyContacts.makeRemoveData(parent_element, 'email');
                },
                makeCreateData: function () {
                    return ui.crud.entity_actions.MyContacts.makeCreateData('/email');
                },
                entity_name: "My Contacts",
            },
            "MyContactsOther": {
                makeUpdateData: function (tr_parent_element) {
                    return ui.crud.entity_actions.MyContacts.makeUpdateData(tr_parent_element);
                },
                makeRemoveData: function (parent_element) {
                    return ui.crud.entity_actions.MyContacts.makeRemoveData(parent_element, 'other');
                },
                makeCreateData: function () {
                    return ui.crud.entity_actions.MyContacts.makeCreateData('/other');
                },
                entity_name: "My Contacts",
            },
            "MyContactsArchived": {
                makeUpdateData: function (tr_parent_element) {
                    return ui.crud.entity_actions.MyContacts.makeUpdateData(tr_parent_element);
                },
                makeRemoveData: function (parent_element) {
                    return ui.crud.entity_actions.MyContacts.makeRemoveData(parent_element, 'archived');
                },
                makeCreateData: function () {
                    return ui.crud.entity_actions.MyContacts.makeCreateData('/archived');
                },
                entity_name: "My Contacts",
            },
            "MyContactsGroups": {
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.id').html();
                    let name = $(tr_parent_element).find('.name').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-contacts-groups/update';
                    let ajax_data = {
                        'name': name,
                        'id': id
                    };

                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.id').html();
                    let name = $(parent_element).find('.name').html();
                    let url = '/my-contacts-groups/remove';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    let message = 'You are about to remove group named <b>' + name + ' </b>. There might be contact connected with it. Are You 100% sure? This might break something...';
                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                        'confirm_message': message
                    };
                },
                makeCreateData: function () {
                    let url = '/my-contacts-settings';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Contacts Groups",
            },
            "MyPasswords": {
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.id').html().trim();
                    let login = $(tr_parent_element).find('.login').html().trim();
                    let password = $(tr_parent_element).find('.password').html().trim();
                    let url = $(tr_parent_element).find('.url').html().trim();
                    let description = $(tr_parent_element).find('.description').html().trim();
                    let groupId = $(tr_parent_element).find('.group :selected').val().trim();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let ajax_url = '/my-passwords/update/';
                    let ajax_data = {
                        'id': id,
                        'password': password,
                        'login': login,
                        'url': url,
                        'description': description,
                        'group': {
                            "type": "entity",
                            'namespace': 'App\\Entity\\Modules\\Passwords\\MyPasswordsGroups',
                            'id': groupId,
                        },
                    };

                    return {
                        'url': ajax_url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'edit': {
                            'invokeAlert': true,
                            'alertMessage': '<b>WARNING</b>! You are about to save Your password. There is NO comming back. If You click save now with all stars **** in the password field then stars will be Your new password!'
                        }
                    }
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.id').html();
                    let url = '/my-passwords/remove/';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                    };

                },
                makeCreateData: function () {
                    let url = '/my-passwords';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                makeCopyData: function (parent_element) {
                    let url = '/my-passwords/get-password/';
                    let id = $(parent_element).find('.id').html();

                    return {
                        'url': url + id,
                        'success_message': ui.crud.messages.password_copy_confirmation_message,
                        'fail_message': ui.crud.messages.default_copy_data_fail_message,
                    };
                },
                entity_name: "My Passwords",
            },
            "MyPasswordsGroups": {
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.id').html();
                    let name = $(tr_parent_element).find('.name').html();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/my-passwords-groups/update';
                    let ajax_data = {
                        'name': name,
                        'id': id
                    };

                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id              = $(parent_element).find('.id').html();
                    let name            = $(parent_element).find('.name').html();
                    let url             = '/my-passwords-groups/remove';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message    = ui.crud.messages.entityRemoveFail(this.entity_name);

                    let message = 'You are about to remove group named <b>' + name + ' </b>. There might be password connected with it. Are You 100% sure? This might break something...';
                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                        'confirm_message': message
                    };
                },
                makeCreateData: function () {
                    let url = '/my-passwords-settings';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Passwords Groups",
            },
            "MyGoals": {
                makeUpdateData: function (tr_parent_element) {
                    let id                          = $(tr_parent_element).find('.id').html();
                    let name                        = $(tr_parent_element).find('.name').html();
                    let description                 = $(tr_parent_element).find('.description').html();
                    let displayOnDashboardCheckbox  = $(tr_parent_element).find('.displayOnDashboard');
                    let displayOnDashboard          = $(displayOnDashboardCheckbox).prop("checked");

                    let success_message     = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message        = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/admin/goals/settings/update';
                    let ajax_data = {
                        'name'               : name,
                        'description'        : description,
                        'id'                 : id,
                        'displayOnDashboard' : displayOnDashboard,
                    };

                    return {
                        'url'                : url,
                        'data'               : ajax_data,
                        'success_message'    : success_message,
                        'fail_message'       : fail_message
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.id').html();
                    let name = $(parent_element).find('.name').html();
                    let url = '/admin/goals/settings/remove';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    let message = 'You are about to remove goal named <b>' + name + ' </b>. There might be subgoal connected with it. Are You 100% sure? This might break something...';
                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                        'confirm_message': message
                    };
                },
                makeCreateData: function () {
                    let url = '/admin/goals/settings/MyGoals';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Goals",
            },
            "MySubgoals": {
                makeUpdateData: function (tr_parent_element) {
                    let id = $(tr_parent_element).find('.id').html();
                    let name = $(tr_parent_element).find('.name').html();
                    let goalId = $(tr_parent_element).find('.goal :selected').val().trim();

                    let success_message = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/admin/subgoals/settings/update';
                    let ajax_data = {
                        'id': id,
                        'name': name,
                        'myGoal': {
                            "type": "entity",
                            'namespace': 'App\\Entity\\Modules\\Goals\\MyGoals',
                            'id': goalId,
                        },
                    };

                    return {
                        'url': url,
                        'data': ajax_data,
                        'success_message': success_message,
                        'fail_message': fail_message
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id = $(parent_element).find('.id').html();
                    let url = '/admin/subgoals/settings/remove';
                    let success_message = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url': url,
                        'data': {
                            'id': id
                        },
                        'success_message': success_message,
                        'fail_message': fail_message,
                        'is_dataTable': false, //temporary
                    };
                },
                makeCreateData: function () {
                    let url = '/admin/goals/settings/MySubgoals';
                    let success_message = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url': url,
                        'success_message': success_message,
                        'fail_message': fail_message,
                    };
                },
                entity_name: "My Subgoals",
            },
            "MyGoalsPayments": {
                makeUpdateData: function (tr_parent_element) {
                    let id                          = $(tr_parent_element).find('.id').html();
                    let name                        = $(tr_parent_element).find('.name').html();
                    let deadline                    = $(tr_parent_element).find('.deadline').html();
                    let collectionStartDate         = $(tr_parent_element).find('.collectionStartDate').html();
                    let moneyGoal                   = $(tr_parent_element).find('.moneyGoal').html();
                    let moneyCollected              = $(tr_parent_element).find('.moneyCollected').html();
                    let displayOnDashboardCheckbox  = $(tr_parent_element).find('.displayOnDashboard');
                    let displayOnDashboard          = $(displayOnDashboardCheckbox).prop("checked");

                    let success_message             = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message                = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let url = '/admin/goals/payments/settings/update';
                    let ajax_data = {
                        'id'                        : id,
                        'name'                      : name,
                        'deadline'                  : deadline,
                        'collectionStartDate'       : collectionStartDate,
                        'moneyGoal'                 : moneyGoal,
                        'moneyCollected'            : moneyCollected,
                        'displayOnDashboard'        : displayOnDashboard,
                    };

                    return {
                        'url'                       : url,
                        'data'                      : ajax_data,
                        'success_message'           : success_message,
                        'fail_message'              : fail_message
                    };
                },
                makeRemoveData: function (parent_element) {
                    let id                  = $(parent_element).find('.id').html();
                    let url                 = '/admin/goals/payments/settings/remove';
                    let success_message     = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message        = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url'               : url,
                        'data'              : {
                            'id'            : id
                        },
                        'success_message'   : success_message,
                        'fail_message'      : fail_message,
                        'is_dataTable'      : false, //temporary
                    };
                },
                makeCreateData: function () {
                    let url                 = '/admin/goals/settings/MyGoalsPayments';
                    let success_message     = ui.crud.messages.entityCreatedRecordSuccess(this.entity_name);
                    let fail_message        = ui.crud.messages.entityCreatedRecordFail(this.entity_name);

                    return {
                        'url'               : url,
                        'success_message'   : success_message,
                        'fail_message'      : fail_message,
                    };
                },
                entity_name: "My Goals Payments",
            },
            "MyFiles": {
                makeUpdateData: function (tr_parent_element) {
                    let subdirectory        = $(tr_parent_element).find('input[name^="file_full_path"]').attr('data-subdirectory');
                    let file_full_path      = $(tr_parent_element).find('input[name^="file_full_path"]').val();
                    let file_new_name       = $(tr_parent_element).find('.file_name').text();

                    let url                 = '/my-files/rename-file';

                    let success_message     = ui.crud.messages.entityUpdateSuccess(this.entity_name);
                    let fail_message        = ui.crud.messages.entityUpdateFail(this.entity_name);

                    let ajax_data = {
                        'file_full_path'    : '/' + file_full_path, // must be this way as download works without "/" and removing with it
                        'file_new_name'     : file_new_name,
                        'subdirectory'      : subdirectory
                    };

                    return {
                        'url'                       : url,
                        'data'                      : ajax_data,
                        'success_message'           : success_message,
                        'fail_message'              : fail_message,
                        'update_template'           : true
                    };
                },
                makeRemoveData: function (parent_element) {
                    let subdirectory        = $(parent_element).find('input[name^="file_full_path"]').attr('data-subdirectory');
                    let file_full_path      = $(parent_element).find('input[name^="file_full_path"]').val();
                    let url                 = '/my-files/remove-file';

                    let success_message     = ui.crud.messages.entityRemoveSuccess(this.entity_name);
                    let fail_message        = ui.crud.messages.entityRemoveFail(this.entity_name);

                    return {
                        'url'               : url,
                        'data'              : {
                            'file_full_path'    : '/' + file_full_path, // must be this way as download works without "/" and removing with it
                            'subdirectory'      : subdirectory
                        },
                        'success_message'   : success_message,
                        'fail_message'      : fail_message,
                        'is_dataTable'      : false, //temporary
                    };
                },
                entity_name: "My files"
            }
        },
        form_target_actions: {
            "UserAvatar": {
                makeUpdateData: function (form) {
                    let avatar = $(form).find('[data-id="avatar"]').val();

                    let url = '/user/profile/settings/update';

                    let ajax_data = {
                        'avatar': avatar,
                    };

                    return {
                        'url': url,
                        'data': ajax_data
                    };
                },
                form_target_action_name: "User Avatar",
            },
            'UserNickname':{
                makeUpdateData: function (form) {
                    let nickname = $(form).find('[data-id="nickname"]').val();

                    let url = '/user/profile/settings/update';

                    let ajax_data = {
                        'nickname': nickname,
                    };

                    return {
                        'url': url,
                        'data': ajax_data
                    };
                },
                form_target_action_name: "User Nickname",
            },
            'UserPassword':{
                makeUpdateData: function (form) {
                    let password = $(form).find('[data-id="password"]').val();

                    let url = '/user/profile/settings/update';

                    let ajax_data = {
                        'password': password,
                    };

                    return {
                        'url': url,
                        'data': ajax_data
                    };
                },
                form_target_action_name: "User Password",
            }
        }
    };

}());

