<?php

namespace App\Controller\Modules\Goals;

use App\Controller\Messages\GeneralMessagesController;
use App\Controller\Utils\Application;
use App\Controller\Utils\Repositories;
use App\Form\Modules\Goals\MyGoalsPaymentsType;
use App\Form\Modules\Goals\MyGoalsType;
use App\Form\Modules\Goals\MySubgoalsType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class MyGoalsSettingsController extends AbstractController
{
    private $em;
    /**
     * @var Application
     */
    private $app;

    public function __construct(Application $app, EntityManagerInterface $em)
    {
        $this->em = $em;
        $this->app = $app;
    }

    /**
     * @Route("/admin/goals/settings/remove", name="goals_settings_remove")
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Exception
     */
    public function removeGoal(Request $request)
    {
        $id = trim($request->request->get('id'));

        $response = $this->app->repositories->deleteById(
            Repositories::MY_GOALS_REPOSITORY_NAME,
            $id
        );

        if ($response->getStatusCode() == 200) {
            return $this->renderTemplate(true);
        }
        return $response;
    }

    /**
     * @param bool $ajax_render
     * @return \Symfony\Component\HttpFoundation\Response
     */
    private function renderTemplate($ajax_render = false)
    {
        $goals_form = $this->getGoalsForm();
        $subgoals_form = $this->getSubGoalsForm();
        $goals_payments_form = $this->getGoalsPaymentsForm();

        $all_goals = $this->app->repositories->myGoalsRepository->findBy(['deleted' => 0]);
        $all_subgoals = $this->app->repositories->myGoalsSubgoalsRepository->findBy(['deleted' => 0]);
        $all_goals_payments = $this->app->repositories->myGoalsPaymentsRepository->findBy(['deleted' => 0]);

        $data = [
            'ajax_render' => $ajax_render,
            'goals_form' => $goals_form->createView(),
            'subgoals_form' => $subgoals_form->createView(),
            'goals_payments_form' => $goals_payments_form->createView(),
            'all_goals' => $all_goals,
            'all_subgoals' => $all_subgoals,
            'all_goals_payments' => $all_goals_payments,
        ];

        return $this->render('modules/my-goals/settings.html.twig', $data);
    }

    /**
     * @return FormInterface
     */
    private function getGoalsForm()
    {
        return $this->createForm(MyGoalsType::class);
    }

    /**
     * @return FormInterface
     */
    private function getSubGoalsForm()
    {
        return $this->createForm(MySubgoalsType::class);
    }

    /**
     * @return FormInterface
     */
    private function getGoalsPaymentsForm()
    {
        return $this->createForm(MyGoalsPaymentsType::class);
    }

    /**
     * @Route("/admin/subgoals/settings/remove", name="subgoals_settings_remove")
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Exception
     */
    public function removeSubgoal(Request $request)
    {
        $id = trim($request->request->get('id'));

        $response = $this->app->repositories->deleteById(
            Repositories::MY_SUBGOALS_REPOSITORY_NAME,
            $id
        );

        if ($response->getStatusCode() == 200) {
            return $this->renderTemplate(true);
        }
        return $response;
    }

    /**
     * @Route("/admin/goals/payments/settings/remove", name="goals_payments_settings_remove")
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Exception
     */
    public function removeGoalPayment(Request $request)
    {
        $id = trim($request->request->get('id'));

        $response = $this->app->repositories->deleteById(
            Repositories::MY_GOALS_PAYMENTS_REPOSITORY_NAME,
            $id
        );

        if ($response->getStatusCode() == 200) {
            return $this->renderTemplate(true);
        }
        return $response;
    }

    /**
     * @Route("/admin/goals/settings/update", name="goals_settings_update")
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Exception
     */
    public function updateGoal(Request $request)
    {
        $parameters = $request->request->all();
        $entity = $this->app->repositories->myGoalsRepository->find($parameters['id']);
        $response = $this->app->repositories->update($parameters, $entity);

        return $response;
    }

    /**
     * @Route("/admin/subgoals/settings/update", name="subgoals_settings_update")
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Exception
     */
    public function updateSubgoal(Request $request)
    {
        $parameters = $request->request->all();
        $entity = $this->app->repositories->myGoalsSubgoalsRepository->find($parameters['id']);
        $response = $this->app->repositories->update($parameters, $entity);

        return $response;
    }

    /**
     * @Route("/admin/goals/payments/settings/update", name="goals_payments_settings_update")
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Exception
     */
    public function updateGoalPayment(Request $request)
    {
        $parameters = $request->request->all();
        $entity = $this->app->repositories->myGoalsPaymentsRepository->find($parameters['id']);
        $response = $this->app->repositories->update($parameters, $entity);

        return $response;
    }

    /**
     * @Route("/admin/goals/settings/{type?}", name="goals_settings")
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Exception
     */
    public function display(Request $request)
    {

        $attributes = $request->attributes->all();
        $type = $attributes['type'];

        $accepted_types = [
            'MyGoals',
            'MySubgoals',
            'MyGoalsPayments'
        ];

        switch ($type) {
            case 'MyGoals':
                $form = $this->getGoalsForm();
                break;
            case 'MySubgoals':
                $form = $this->getSubGoalsForm();
                break;
            case 'MyGoalsPayments':
                $form = $this->getGoalsPaymentsForm();
                break;
        }

        if (in_array($type, $accepted_types)) {

            $response = $this->addRecord($form, $request);

            if ($response->getStatusCode() != 200) {
                return $response;
            }

        }

        if (!$request->isXmlHttpRequest()) {
            return $this->renderTemplate(false);
        }

        return $this->renderTemplate(true);
    }

    /**
     * @param FormInterface $form
     * @param Request $request
     * @return JsonResponse
     */
    protected function addRecord(FormInterface $form, Request $request)
    {
        $form->handleRequest($request);
        $form_data = $form->getData();

        if (!is_null($form_data) && $this->app->repositories->myGoalsRepository->findBy(['name' => $form_data->getName()])) {
            return new JsonResponse(GeneralMessagesController::RECORD_WITH_NAME_EXISTS, 409);
        }

        if ($form->isSubmitted() && $form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            $em->persist($form_data);
            $em->flush();
        }

        return new JsonResponse(GeneralMessagesController::FORM_SUBMITTED, 200);
    }
}
