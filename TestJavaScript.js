<script>


      document.addEventListener("DOMContentLoaded", () => {
        var root = document.body;
        var bodyContent = "";
        Coveo.SearchEndpoint.endpoints["default"] = new Coveo.SearchEndpoint({
          restUri: "https://platform.cloud.coveo.com/rest/search",
          accessToken: "xxcce7acb7-c66e-4e48-bcde-12377b859b65"
        });
        Coveo.init(root);  

        const fieldsSelector = ".coveo-case-creation-input, .coveo-case-creation-input";
        function stripHtml(html) {

            return (new DOMParser).parseFromString(html, "text/html") . 
                documentElement . textContent;
        
        }
        
        // Adds the content of the Title and Description form fields to the Coveo longQueryExpression for every query sent to Coveo.
        Coveo.$$(root).on(Coveo.QueryEvents.buildingQuery, (event, args) => {
            

          $(fieldsSelector).each((index, inputField) => {
            const fieldValue = $(inputField).val().replace(/(<[a-zA-Z\/][^<>]*>|\[([^\]]+)\])|(\s+)/ig,'')
            if (fieldValue) {
              args.queryBuilder.longQueryExpression.add(fieldValue);
                // Contextual information about the job title or department of the authenticated user, if any.
                // args.queryBuilder.addContextValue("jobtitle", "{{ user.jobtitle }}");
            }
          })

          if(bodyContent){
            args.queryBuilder.longQueryExpression.add(bodyContent);
          }

            /* var $body = $(".MessageEditor .lia-message-editor");
            var curValue = $body.val();
            if(curValue !=""){
                curValue = stripHtml(curValue);
                args.queryBuilder.longQueryExpression.add(curValue);
                
            } */

                                
        });
        // Triggers a search when the user has stopped typing for 300ms.
        let typingTimer;
        const typingTimerInterval = 300;
        // Listens for the changes in the Title and Description form fields and triggers new queries as the customer types.
        $(fieldsSelector).each((index, inputField) => {
          $(inputField).on('keyup', () => {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
              // Instructs the 'executeQuery' to log a search event in Coveo Usage Analytics.
              caseCreationLogger.hookLogCaseInputChangeToExecuteQuery();
              // Makes a call to Coveo Cloud querying for new case recommendations based on new user input.
              Coveo.executeQuery(root);
            }, typingTimerInterval);
          });
        });

        $iframe = $(".MessageEditor iframe");

		$iframe.ready(function() {
                tinyMCE.get('tinyMceEditor').on('keyup',function(e){
                    bodyContent = this.getContent().replace(/(<[a-zA-Z\/][^<>]*>|\[([^\]]+)\])|(\s+)/ig,'');

                    clearTimeout(typingTimer);
                    typingTimer = setTimeout(() => {
                    // Instructs the 'executeQuery' to log a search event in Coveo Usage Analytics.
                    caseCreationLogger.hookLogCaseInputChangeToExecuteQuery();
                    // Makes a call to Coveo Cloud querying for new case recommendations based on new user input.
                    Coveo.executeQuery(root);
                    }, typingTimerInterval);
                

                });
        });
        const caseCreationLogger = {
          // Instructs the 'executeQuery' action to log a search event in Coveo Usage Analytics.
          hookLogCaseInputChangeToExecuteQuery:() => {
            Coveo.logSearchAsYouTypeEvent(root, { name: "CaseCreationInputChange", type: "InputChange" }, caseCreationLogger._getMetadata());
            caseCreationLogger.hasInputChange = true;
          },
          // Instructs the submit action to log a case submit event in Coveo Usage Analytics.
          hookLogCaseCreationToSubmitAction:() => {
            const addCaseSubmitEvent = (fn) => {
              const WebForm_OnSubmit_Original = WebForm_OnSubmit;
              WebForm_OnSubmit = () => {
                return WebForm_OnSubmit_Original() && fn();
              };
            };
            addCaseSubmitEvent(() => {
              Coveo.logCustomEvent(root, { name: "CaseCreationSubmit", type: "Submit" }, caseCreationLogger._getMetadata());
              caseCreationLogger.hasSubmit = true;
              return true;
            });
          },
          // Instructs the unload action to log a case deflected event in Coveo Usage Analytics.
          hookLogCaseCreationDeflectedToUnloadAction:() => {
            window.addEventListener("beforeunload", function (event) {
              if (caseCreationLogger.hasInputChange && !caseCreationLogger.hasSubmit) {
                Coveo.logCustomEvent(root, { name: "CaseCreationDeflected", type: "Unload" }, caseCreationLogger._getMetadata());
              }
            });
          },
          // Creates a JSON object with the content of the Title and Description form fields in the format { title: "", description: "" }.
          _getMetadata:() => {
            let metadata = {};
            $(fieldsSelector).each((index, element) => { metadata[element.id] = element.value; });
            return metadata;
          },
          hasInputChange: false,
          hasSubmit: false
        };
        caseCreationLogger.hookLogCaseCreationToSubmitAction();
        caseCreationLogger.hookLogCaseCreationDeflectedToUnloadAction(); 
      });
    
</script>